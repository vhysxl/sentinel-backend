import { config } from '../config/env.config.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

/**
 * The only place this API talks to the FastAPI analysis service.
 *
 * It sits at the same layer as `db/queries` — services call it, controllers
 * never do. Findings live in the agent server's tables rather than ours, so
 * this is the "query layer" for that resource.
 *
 * Nothing here forwards the caller's credentials: the agent server has no notion
 * of users and is not meant to have one. Authorisation happens before we get
 * here, in `authenticate`, and identity is passed as plain data (see resolve()).
 *
 * What this client does present is a shared secret proving the caller is this
 * API rather than a stranger who found the URL. It is not an IP allowlist
 * because Vercel's egress addresses rotate, and it is not a substitute for
 * keeping the agent server off the public internet — it is the last layer.
 */

// Findings endpoints are plain database reads or a single-row update, so a call
// that takes longer than this means the service is wedged, not busy.
const TIMEOUT_MS = 10_000;

// Ask is the exception: it spends two round trips to the LLM (pick the tool,
// then narrate the numbers Python computed). Ten seconds cuts off answers that
// were on their way.
const ASK_TIMEOUT_MS = 45_000;

const INTERNAL_KEY_HEADER = 'X-Internal-Key';

async function agentRequest(
  path,
  { method = 'GET', body, timeoutMs = TIMEOUT_MS, notFoundOnError = false } = {}
) {
  // Checked here rather than at boot: a missing key is a findings-only problem,
  // and refusing to start the whole API over it would take down login and
  // transactions too. The agent server rejects unkeyed calls anyway, so this
  // only turns a confusing 401 into a log line that names the cause.
  if (!config.agentServerKey) {
    console.error(
      `[AGENT] AGENT_SERVER_KEY is not set — refusing to call ${method} ${path}. ` +
        'It must match INTERNAL_API_KEY on the agent server.'
    );
    throw createError(ERROR_MESSAGES.AGENT_SERVER_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const url = `${config.agentServerUrl}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        [INTERNAL_KEY_HEADER]: config.agentServerKey,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    // Unreachable, DNS failure, or timed out. The user should be told to retry,
    // not shown a stack trace, and certainly not a 500 that looks like our bug.
    console.error(`[AGENT] ${method} ${path} unreachable: ${error.message}`);
    throw createError(ERROR_MESSAGES.AGENT_SERVER_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // A 401 is never the end user's fault: it means the two services disagree
  // about the shared secret, or the agent server has none configured and is
  // failing closed. Called out separately so it does not hide among ordinary
  // outages as a generic "unavailable" in the logs.
  if (response.status === HTTP_STATUS.UNAUTHORIZED) {
    console.error(
      `[AGENT] ${method} ${path} -> 401: our key was rejected. AGENT_SERVER_KEY here and ` +
        'INTERNAL_API_KEY on the agent server must be the same non-empty value.'
    );
    throw createError(ERROR_MESSAGES.AGENT_SERVER_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  if (!response.ok) {
    // FastAPI's own error bodies can quote internal paths and SQL, so the
    // detail stays in our logs and the client gets the generic message.
    console.error(
      `[AGENT] ${method} ${path} -> ${response.status}: ${JSON.stringify(payload)?.slice(0, 300)}`
    );
    throw createError(ERROR_MESSAGES.AGENT_SERVER_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  // The agent server reports a missing finding as 200 + { error: "..." }, so the
  // status code alone cannot be trusted there.
  //
  // Opt-in rather than global, because `{ error }` does not mean the same thing
  // on every endpoint: on /api/ask it means the LLM could not plan or narrate an
  // answer, and translating that into "Finding not found" would be nonsense.
  if (
    notFoundOnError &&
    payload &&
    !Array.isArray(payload) &&
    typeof payload === 'object' &&
    payload.error
  ) {
    console.error(`[AGENT] ${method} ${path} -> not found: ${payload.error}`);
    throw createError(ERROR_MESSAGES.FINDING_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return payload;
}

export class AgentClient {
  /** Returns a bare array, ordered by severity then score. */
  static listFindings({ status, riskLevel, limit }) {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (riskLevel) query.set('risk_level', riskLevel);
    if (limit) query.set('limit', String(limit));

    const qs = query.toString();
    return agentRequest(`/api/findings${qs ? `?${qs}` : ''}`);
  }

  /** Same row as the list, plus `evidence` and `analysis`. */
  static getFinding(id) {
    return agentRequest(`/api/findings/${id}`, { notFoundOnError: true });
  }

  /**
   * `resolvedBy` is supplied by the caller of this method, never by the HTTP
   * client — see FindingService.resolve.
   */
  static resolveFinding(id, { resolution, note, resolvedBy }) {
    return agentRequest(`/api/findings/${id}/resolve`, {
      method: 'PATCH',
      body: { resolution, note: note ?? null, resolved_by: resolvedBy },
      notFoundOnError: true
    });
  }

  /** Counts for the top of the findings page. */
  static getSummary() {
    return agentRequest('/api/summary');
  }

  /**
   * One question, one answer — the agent server keeps no conversation history,
   * so nothing needs to be threaded through from here.
   *
   * The model never sees a transaction row and never runs a tool itself: it
   * picks the tool and period, Python executes it, and the model only narrates
   * figures that already exist. `unsourced_figures` in the reply lists any
   * number in the prose that no tool produced.
   */
  static ask(question) {
    return agentRequest('/api/ask', {
      method: 'POST',
      body: { question },
      timeoutMs: ASK_TIMEOUT_MS
    });
  }
}
