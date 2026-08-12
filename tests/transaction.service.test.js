import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

import { importTransactionsSchema } from '../src/validations/transaction.validation.js';
import { TransactionService } from '../src/services/transaction.service.js';
import { TransactionsQuery } from '../src/db/queries/transactions.query.js';
import { VendorsQuery } from '../src/db/queries/vendors.query.js';
import { AgentClient } from '../src/clients/agent.client.js';

test('import schema: valid rows pass, missing vendor for vendor-required category fails', () => {
  const ok = importTransactionsSchema.safeParse({
    body: {
      transactions: [
        { amount: 4500000, type: 'expense', category: 'Office Supplies', description: 'x', vendor_name: 'CV A' },
        { amount: 12000000, type: 'income', category: 'Sales', description: 'y' },
      ],
    },
  });
  assert.ok(ok.success);

  const bad = importTransactionsSchema.safeParse({
    body: {
      transactions: [
        { amount: 4500000, type: 'expense', category: 'Office Supplies', description: 'x' },
      ],
    },
  });
  assert.equal(bad.success, false);
  const issue = bad.error.issues.find((i) => i.path.includes('vendor_id'));
  assert.ok(issue, 'expected a vendor_id issue');
});

test('import schema: rejects both vendor_name and vendor_id together', () => {
  const r = importTransactionsSchema.safeParse({
    body: {
      transactions: [
        { amount: 1, type: 'expense', category: 'Office Supplies', description: 'x', vendor_name: 'A', vendor_id: 5 },
      ],
    },
  });
  assert.equal(r.success, false);
});

test('import schema: caps at 2000 rows', () => {
  const rows = Array.from({ length: 2001 }, (_, i) => ({
    amount: 1, type: 'expense', category: 'Office Supplies', description: `x${i}`, vendor_name: 'A',
  }));
  const r = importTransactionsSchema.safeParse({ body: { transactions: rows } });
  assert.equal(r.success, false);
});

test('import service: resolves vendors, batch-inserts, fires analysis per expense', async () => {
  const created = [
    { id: 1, type: 'expense', amount: '4500000.00' },
    { id: 2, type: 'income', amount: '12000000.00' },
  ];

  mock.method(VendorsQuery, 'findByName', async () => null);
  mock.method(VendorsQuery, 'create', async ({ vendor_name }) => ({ id: 9, vendor_name }));
  mock.method(TransactionsQuery, 'createMany', async (rows) => {
    assert.equal(rows.length, 2);
    // expense resolved vendor, income did not require one
    assert.equal(rows[0].vendor_id, 9);
    assert.equal(rows[1].vendor_id, null);
    return created;
  });
  const analyze = mock.method(AgentClient, 'analyzeOne', async () => ({ accepted: true }));
  mock.method(VendorsQuery, 'findById', async () => ({ id: 9 }));

  const result = await TransactionService.importTransactions({
    transactions: [
      { amount: 4500000, type: 'expense', category: 'Office Supplies', description: 'x', vendor_name: 'CV Baru' },
      { amount: 12000000, type: 'income', category: 'Sales', description: 'y' },
    ],
    inputByUserId: 3,
  });

  assert.equal(result.inserted.length, 2);
  assert.equal(result.errors.length, 0);
  // only the expense triggers analysis
  assert.equal(analyze.mock.callCount(), 1);
  assert.equal(analyze.mock.calls[0].arguments[0], 1);
  // wait for fire-and-forget promises to settle
  await new Promise((r) => setTimeout(r, 10));
  mock.reset();
});

test('import service: rejects rows with a missing vendor and reports row number', async () => {
  mock.method(VendorsQuery, 'findByName', async () => null);
  mock.method(VendorsQuery, 'findById', async () => null);
  mock.method(TransactionsQuery, 'createMany', async () => []);
  mock.method(AgentClient, 'analyzeOne', async () => ({ accepted: true }));

  const result = await TransactionService.importTransactions({
    transactions: [
      { amount: 4500000, type: 'expense', category: 'Office Supplies', description: 'x', vendor_name: 'Missing' },
    ],
    inputByUserId: 3,
  });

  assert.equal(result.inserted.length, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].row, 1);
  mock.reset();
});
