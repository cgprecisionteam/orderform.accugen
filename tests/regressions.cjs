// Run with node --test tests/regressions.cjs. No network calls or emails are made.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(relative, mocks = {}, cache = new Map()) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/')) return load(id.slice(2) + '.ts', mocks, cache);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id) + '.ts', mocks, cache);
    throw new Error(`Unmocked dependency: ${id}`);
  };
  new Function('require', 'exports', 'console', 'process', code)(localRequire, exports,
    { log() {}, error() {} }, { env: { RESEND_API_KEY: 'test-only-not-a-real-key' } });
  return exports;
}
const v = load('lib/validation.ts');

test('dates reject past and impossible dates, and accept today/future in lab timezone', () => {
  for (const date of ['2000-01-01', '2099-02-30', '', null, 'tomorrow']) assert.equal(v.isValidDate(date), false);
  assert.equal(v.isValidDate(v.labDate()), true);
  assert.equal(v.isValidDate(v.labDate(1)), true);
});
test('all products enforce the correct tooth or arch location', () => {
  const { PRODUCT_TYPES } = load('lib/products.ts');
  for (const product of PRODUCT_TYPES) {
    assert.ok(v.locationError({ productType: product.label }));
    const location = product.unitType === 'per_arch' ? { arch: 'Both' } : { toothNumbers: [11, 48] };
    assert.equal(v.locationError({ productType: product.label, ...location }), undefined);
  }
  assert.ok(v.locationError({ productType: 'Full Crown', toothNumbers: [19] }));
});
test('upload limits enforce count, individual size, and combined size', () => {
  assert.equal(v.uploadError(Array.from({ length: 20 }, () => ({ size: 1 }))), undefined);
  assert.ok(v.uploadError(Array.from({ length: 21 }, () => ({ size: 1 }))));
  assert.ok(v.uploadError([{ size: v.MAX_FILE_BYTES + 1 }]));
  assert.ok(v.uploadError(Array.from({ length: 4 }, () => ({ size: v.MAX_FILE_BYTES }))));
});

const order = {
  clinicName: 'Test clinic', email: 'test@example.com', patientName: 'Test case', deliveryDate: v.labDate(1),
  items: [{ productType: 'Full Crown', unitType: 'per_tooth', toothNumbers: [11], material: 'PMMA', shade: 'A2' }], files: [],
};
const scan = { clinicName: 'Test clinic', clinicEmail: 'test@example.com', preferredDate: v.labDate(1), preferredTime: '10:00 AM – 10:30 AM' };
const accepted = { data: { id: 'mock-email' }, error: null };
async function callRoute(route, body, results) {
  const calls = [];
  class Resend {
    emails = { send: async message => {
      calls.push(message);
      const result = results[calls.length - 1];
      if (result instanceof Error) throw result;
      assert.ok(result, 'Unexpected email attempt');
      return result;
    } };
  }
  const api = load(route, {
    resend: { Resend },
    'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
  });
  return { response: await api.POST({ json: async () => body }), calls };
}
for (const [route, body, dateKey] of [
  ['app/api/order/route.ts', order, 'deliveryDate'],
  ['app/api/scan-request/route.ts', scan, 'preferredDate'],
]) {
  test(`${route}: lab rejection or exception never reports success or sends confirmation`, async () => {
    for (const failure of [{ data: null, error: { message: 'Rejected' } }, new Error('Unavailable')]) {
      const { response, calls } = await callRoute(route, body, [failure]);
      assert.equal(response.status, 502);
      assert.equal(response.body.success, false);
      assert.equal(calls.length, 1);
    }
  });
  test(`${route}: confirmation failure preserves successful lab submission`, async () => {
    const { response, calls } = await callRoute(route, body, [accepted, { data: null, error: { message: 'Rejected' } }]);
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.emailStatus.client, 'failed');
    assert.equal(calls.length, 2);
  });
  test(`${route}: success requires accepted messages`, async () => {
    const { response } = await callRoute(route, body, [accepted, accepted]);
    assert.equal(response.body.emailStatus.lab, 'sent');
    assert.equal(response.body.emailStatus.client, 'sent');
  });
  test(`${route}: past date is rejected before emailing`, async () => {
    const { response, calls } = await callRoute(route, { ...body, [dateKey]: '2000-01-01' }, []);
    assert.equal(response.status, 400);
    assert.equal(calls.length, 0);
  });
}
test('order API rejects missing location and excess uploads before emailing', async () => {
  for (const body of [
    { ...order, items: [{ ...order.items[0], toothNumbers: [] }] },
    { ...order, files: Array.from({ length: 21 }, () => ({ size: 1 })) },
  ]) {
    const { response, calls } = await callRoute('app/api/order/route.ts', body, []);
    assert.equal(response.status, 400);
    assert.equal(calls.length, 0);
  }
});
