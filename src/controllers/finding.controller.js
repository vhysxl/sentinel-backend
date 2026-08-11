import { FindingService } from '../services/finding.service.js';
import { successResponse, errorResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

// A run goes legitimately quiet for ~15s at a stretch while three LLM agents
// work through one transaction. Without a keepalive, idle proxies read that
// silence as a dead connection and hang up mid-run.
const HEARTBEAT_MS = 15_000;

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  // `no-transform` earns its place next to `no-cache`: a proxy that helpfully
  // gzips the response will buffer it into uselessness.
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  // nginx-family proxies buffer upstream responses by default. This opts out.
  'X-Accel-Buffering': 'no'
};

export class FindingController {
  static list = asyncHandler(async (req, res) => {
    // The agent server answers with a bare array; wrapping it keeps the shape
    // consistent with every other list endpoint here.
    const findings = await FindingService.list(req.query);
    return successResponse(res, 'Findings retrieved successfully', { findings });
  });

  static summary = asyncHandler(async (req, res) => {
    const summary = await FindingService.summary();
    return successResponse(res, 'Findings summary retrieved successfully', { summary });
  });

  static getById = asyncHandler(async (req, res) => {
    const finding = await FindingService.getById(req.params.id);
    return successResponse(res, 'Finding retrieved successfully', { finding });
  });

  static resolve = asyncHandler(async (req, res) => {
    // req.user.sub, never req.body — the client does not get to say who it is.
    const finding = await FindingService.resolve(req.params.id, req.body, req.user.sub);
    return successResponse(res, 'Finding resolved successfully', { finding });
  });

  /**
   * Relays the agent server's analysis stream to the browser.
   *
   * The one handler here that uses neither `asyncHandler` nor `successResponse`,
   * and both omissions are deliberate:
   *
   *   successResponse sends JSON, which a stream cannot be.
   *   asyncHandler forwards rejections to errorHandler, which calls
   *   res.status().json() — fatal once SSE headers have been flushed.
   *
   * So the shape is: do everything that can fail first, commit to the stream
   * only after it has all succeeded, and from that point on report failures in
   * the stream's own language.
   *
   * This relay is also the only reason the browser can see any of this at all.
   * The agent server is sealed behind X-Internal-Key and fails closed; that key
   * lives here and must never reach a client.
   */
  static analyze = async (req, res) => {
    const { startDate, endDate, force } = req.body;
    const upstream = new AbortController();

    let body;
    try {
      body = await FindingService.startAnalysis({
        startDate,
        endDate,
        force,
        signal: upstream.signal
      });
    } catch (error) {
      // Nothing written yet, so an ordinary status code is still possible.
      // This is the only window in which that is true — hence doing the whole
      // handshake up front rather than lazily on first read.
      if (!error.isOperational) {
        console.error(`[FINDINGS][analyze] ${req.originalUrl}:`, error.stack || error);
      }
      return errorResponse(
        res,
        error.isOperational ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
        error.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    res.writeHead(HTTP_STATUS.OK, SSE_HEADERS);
    res.flushHeaders();

    let buffer = '';

    const heartbeat = setInterval(() => {
      // Between frames only. A comment line spliced into a half-received
      // `data:` frame would corrupt the frame it landed in.
      if (buffer === '') res.write(': keepalive\n\n');
    }, HEARTBEAT_MS);

    // A browser navigating away has to stop the work upstream, not just here.
    // Otherwise the agent server carries on paying for LLM calls that nobody is
    // left to read. Safe to cut at any point: runs are resumable, so the next
    // one picks up the remainder instead of starting over.
    req.on('close', () => {
      clearInterval(heartbeat);
      upstream.abort();
    });

    const reader = body.getReader();
    const decoder = new TextDecoder();

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        // `stream: true` so a multi-byte character split across two chunks is
        // reassembled rather than mangled — the narratives are Indonesian and
        // full of them.
        buffer += decoder.decode(value, { stream: true });

        // Forward complete frames only, holding any partial tail back for the
        // next read. This is what makes the heartbeat above safe.
        const boundary = buffer.lastIndexOf('\n\n');
        if (boundary === -1) continue;

        res.write(buffer.slice(0, boundary + 2));
        buffer = buffer.slice(boundary + 2);
      }
    } catch (error) {
      // `req.destroyed` means we aborted this ourselves because the client left
      // — expected, and there is nobody to tell.
      if (!req.destroyed) {
        console.error(`[FINDINGS][analyze] stream failed: ${error.message}`);
        res.write(
          `data: ${JSON.stringify({
            status: 'error',
            message: ERROR_MESSAGES.AGENT_SERVER_UNAVAILABLE
          })}\n\n`
        );
      }
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  };
}
