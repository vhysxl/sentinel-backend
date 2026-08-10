import { AgentClient } from '../clients/agent.client.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export class AskService {
  static async ask(question) {
    const payload = await AgentClient.ask(question);

    // ask_sentinel gives up with { error, detail } when the model cannot plan a
    // query, or cannot turn the results into prose — usually a spent quota or a
    // reply that failed to parse. There is no answer to render and the user's
    // question was not at fault, so it surfaces as a temporary failure instead
    // of an empty bubble in the chat.
    //
    // A question the tools genuinely cannot cover is NOT this case: that comes
    // back with a real `answer` explaining the limit, and passes through.
    if (payload?.error && !payload.answer) {
      console.error(`[ASK] agent could not answer: ${payload.error} — ${payload.detail ?? ''}`);
      throw createError(ERROR_MESSAGES.ASK_FAILED, HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    return payload;
  }
}
