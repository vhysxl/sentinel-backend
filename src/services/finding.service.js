import { AgentClient } from '../clients/agent.client.js';

export class FindingService {
  static async list({ status, risk_level, limit }) {
    return await AgentClient.listFindings({ status, riskLevel: risk_level, limit });
  }

  static async getById(id) {
    return await AgentClient.getFinding(id);
  }

  /**
   * Closes a finding on behalf of the authenticated user.
   *
   * `resolvedBy` comes from the verified access token and is the whole reason
   * this relay exists. The agent server accepts `resolved_by` straight from its
   * request body, so a browser talking to it directly could close a finding
   * under someone else's name — and for an audit tool, a forgeable "who signed
   * this off" is worse than no record at all.
   */
  static async resolve(id, { resolution, note }, resolvedBy) {
    const finding = await AgentClient.resolveFinding(id, { resolution, note, resolvedBy });
    console.log(`[FINDINGS][resolve] finding ${id} closed as ${resolution} by user ${resolvedBy}`);
    return finding;
  }

  static async summary() {
    return await AgentClient.getSummary();
  }

  /**
   * Starts a backfill and returns the raw upstream stream for the controller to
   * pump. The service layer stops at "here is the body" on purpose — how it is
   * framed, heartbeated and torn down is a transport concern, not a domain one.
   */
  static async startAnalysis({ startDate, endDate, force, signal }) {
    const stream = await AgentClient.streamAnalysis({ startDate, endDate, force, signal });
    console.log(`[FINDINGS][analyze] run started for ${startDate}..${endDate} (force=${force})`);
    return stream;
  }
}
