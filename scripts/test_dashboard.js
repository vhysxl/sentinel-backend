import 'dotenv/config';
import { getDashboardSummary } from '../src/controllers/dashboard.controller.js';

async function test() {
  const req = { user: { id: 1 }, query: {} };
  const res = {
    status: function(code) { this.code = code; return this; },
    json: function(data) { console.log('Dashboard API Output:', JSON.stringify(data, null, 2)); }
  };
  
  await getDashboardSummary(req, res);
  process.exit(0);
}

test();
