import { AskService } from '../services/ask.service.js';
import { successResponse } from '../utils/api-response.util.js';
import { asyncHandler } from '../utils/async-handler.util.js';

export class AskController {
  static ask = asyncHandler(async (req, res) => {
    // Passed through unwrapped: the agent server's reply is already the whole
    // resource (answer, figures, tools_used, steps, unsourced_figures, warning),
    // and nesting it under another key would only add `data.ask.answer`.
    const result = await AskService.ask(req.body.question);
    return successResponse(res, 'Answer generated successfully', result);
  });

  static getHistory = asyncHandler(async (req, res) => {
    const { limit, topic, start_date, end_date } = req.query;
    const result = await AskService.getHistory({ limit, topic, start_date, end_date });
    return successResponse(res, 'Ask history fetched successfully', result);
  });
}
