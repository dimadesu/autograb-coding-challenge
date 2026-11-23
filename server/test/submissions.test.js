import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { VEHICLES } from '../src/data/vehicles.js';

describe('API endpoints', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });

  it('GET /api/vehicles returns the vehicle catalog', async () => {
    const res = await fetch(`${baseUrl}/api/vehicles`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), VEHICLES);
  });

  it('POST /api/submissions rejects missing fields', async () => {
    const form = new FormData();
    form.append('make', 'ford');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('POST /api/submissions rejects mismatched make/model/badge combinations', async () => {
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Model 3');
    form.append('badge', 'Performance');
    form.append('logbook', new Blob(['Service entry 1'], { type: 'text/plain' }), 'logbook.txt');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /invalid make, model, and badge/i);
  });

  it('POST /api/submissions rejects non-plain-text files', async () => {
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append('logbook', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'logbook.pdf');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /plain text/i);
  });

  it('POST /api/submissions accepts valid make/model/badge and plain text logbook', async () => {
    const logbookText = '2025-01-15: 15,000km service completed.\n2025-07-20: Oil and filter change.';
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append('logbook', new Blob([logbookText], { type: 'text/plain' }), 'ranger-logbook.txt');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.make, 'ford');
    assert.equal(body.model, 'Ranger');
    assert.equal(body.badge, 'Raptor');
    assert.equal(body.logbook.fileName, 'ranger-logbook.txt');
    assert.equal(body.logbook.content, logbookText);
  });
});
