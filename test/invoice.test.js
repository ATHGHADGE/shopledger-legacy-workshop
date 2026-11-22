'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');

test('invoice matches the GST breakdown and total billed for an HSN coupon order', function () {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 640, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const figures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.deepEqual(
    { subtotal: figures.subtotal, discount: figures.discount, tax: figures.tax, total: figures.total },
    { subtotal: billed.subtotal, discount: billed.discount, tax: billed.tax, total: billed.total }
  );
  assert.deepEqual(
    { cgst: figures.cgst, sgst: figures.sgst },
    { cgst: billed.cgst, sgst: billed.sgst }
  );
  assert.equal(figures.rows[0].gstPercent, billed.lines[0].gstPercent);
  assert.equal(figures.rows[0].lineTax, billed.lines[0].tax);
});

test('CURRENT BEHAVIOUR: ledger applies HSN GST and caps SAVE10 before totaling', function () {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 3000, qty: 1 }];
  const totals = pricing.computeTotals(items, 'SAVE10');

  assert.equal(totals.subtotal, 3000);
  assert.equal(totals.discount, 150);
  assert.equal(totals.tax, 142.5);
  assert.equal(totals.total, 2992.5);
  assert.deepEqual({ cgst: totals.cgst, sgst: totals.sgst }, { cgst: 71.25, sgst: 71.25 });
});

test('invoice figures match ledger HSN GST and capped coupon totals', function () {
  const order = {
    id: 1,
    coupon: 'SAVE10',
    items: [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 3000, qty: 1 }]
  };
  const figures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { subtotal: figures.subtotal, discount: figures.discount, tax: figures.tax, total: figures.total },
    { subtotal: 3000, discount: 150, tax: 142.5, total: 2992.5 }
  );
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.deepEqual({ cgst: figures.cgst, sgst: figures.sgst }, { cgst: 71.25, sgst: 71.25 });
});

test('invoice HTML displays ledger totals and GST without a mismatch warning', function () {
  const html = invoice.render({
    id: 7,
    date: '22/11/2026',
    customer: 'Walk-in',
    paymentMode: 'cash',
    status: 'completed',
    coupon: 'SAVE10',
    items: [{ name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 3000, qty: 1 }],
    subtotal: 3000,
    discount: 150,
    tax: 142.5,
    total: 2992.5
  });

  assert.match(html, /5%/);
  assert.match(html, /₹142\.50/);
  assert.match(html, /₹150\.00/);
  assert.match(html, /₹2992\.50/);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});

test('CURRENT BEHAVIOUR: reconciliation flags a GST-only mismatch but totalDelta sums only invoice-total differences', function () {
  const result = reports.getGstReconciliation({
    orders: [
      {
        id: 11,
        date: '22/11/2026',
        customer: 'Test customer',
        items: [{ name: 'Rice', price: 100, qty: 1, hsn: '1006' }],
        subtotal: 100,
        discount: 0,
        tax: 6,
        total: 105,
        status: 'completed'
      },
      { id: 12, status: 'cancelled', items: [], total: 500, tax: 90 }
    ]
  });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 1);
  assert.equal(result.totalDelta, 0);
  assert.equal(result.rows[0].delta, 0);
  assert.equal(result.rows[0].invoiceTax, 5);
  assert.equal(result.rows[0].ledgerTax, 6);
  assert.equal(result.rows[0].matched, false);
});
