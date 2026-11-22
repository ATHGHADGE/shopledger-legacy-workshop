'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('inventory accepts and deducts the exact remaining sellable quantity for every SKU', function () {
  const products = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
    { id: 11, sku: 'SPC-001', name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 },
    { id: 99, sku: 'TEST-001', name: 'Another SKU', stock: 8, reserved: 2 }
  ];

  for (const product of products) {
    const sellable = inventory.getSellableStock(product);
    assert.ok(sellable > 0, `${product.sku} should have sellable units`);
    const items = [{ id: product.id, qty: sellable }];
    assert.deepEqual(inventory.check(products, items), { ok: true });
    inventory.reserve(products, items);
    assert.equal(product.stock, product.reserved);
    assert.equal(inventory.getSellableStock(product), 0);
  }
});

test('cancelling pending Order #1007 restores physical and sellable stock for every item', function () {
  const db = {
    products: [
      { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
      { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', stock: 22, reserved: 4 }
    ],
    orders: [{
      id: 1007,
      date: '04/03/2022',
      customer: 'Suresh Deshmukh',
      customerId: 4,
      paymentMode: 'khata',
      status: 'pending',
      items: [
        { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', qty: 2 },
        { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', qty: 2 }
      ],
      total: 1407
    }],
    customers: []
  };
  const before = db.products.map(p => ({ id: p.id, stock: p.stock, sellable: inventory.getSellableStock(p) }));

  const result = orders.cancel(db, 1007, 'test cancellation');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(db.products.map(p => p.stock), [3, 24]);
  assert.deepEqual(db.products.map(p => inventory.getSellableStock(p)), [3, 20]);
  assert.deepEqual(db.products.map(p => p.reserved), [0, 4]);
  assert.ok(db.products.every((p, index) => p.stock > before[index].stock));
});
