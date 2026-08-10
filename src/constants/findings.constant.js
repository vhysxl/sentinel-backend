/**
 * Mirrors `app/core/constants.py` in the agent server.
 *
 * Duplicated deliberately: this API validates a resolution before forwarding
 * it, so a bad value is rejected here with a field-level 400 rather than
 * reaching FastAPI, which answers a rejected resolution with 200 and an
 * `{ error }` body that no client can act on.
 *
 * Both lists must change together. The agent server is the source of truth.
 */
export const RESOLUTIONS = Object.freeze([
  'justified',
  'false_positive',
  'confirmed_fraud',
  'escalated'
]);

export const RISK_LEVELS = Object.freeze(['low', 'medium', 'high', 'critical']);

/** `status` accepted by GET /api/findings. Not a finding field — a query filter. */
export const FINDING_STATUS_FILTERS = Object.freeze(['open', 'resolved', 'all']);
