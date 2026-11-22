'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

test('order history displays orders newest first across calendar years', function () {
  const db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' }
    ]
  };

  assert.deepEqual(orders.list(db).map(o => o.id), [1008, 1004, 1001]);
});

test('date range includes only orders inside the selected calendar dates', function () {
  const db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' }
    ]
  };

  const selectedRange = { from: '2022-01-01', to: '2022-03-31' };
  assert.deepEqual(orders.list(db, selectedRange).map(o => o.id), [1008, 1004]);
});

test('Meera Joshi settlement adds the numeric payment and reduces Balance Due', function () {
  const db = {
    customers: [{
      id: 7,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200
    }],
    settlements: [],
    nextSettlementId: 501
  };

  assert.deepEqual(ledger.listCustomers(db).map(c => ({
    name: c.name,
    totalSettled: c.totalSettled,
    balance: c.balance
  })), [{ name: 'Meera Joshi', totalSettled: 1200, balance: 1232.01 }]);

  const result = ledger.recordSettlement(db, 7, '500', 'upi', 'Part payment');

  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 500);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.deepEqual(ledger.listCustomers(db).map(c => ({
    name: c.name,
    totalSettled: c.totalSettled,
    balance: c.balance
  })), [{ name: 'Meera Joshi', totalSettled: 1700, balance: 732.01 }]);
});
