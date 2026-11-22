import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

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

  it('POST /api/submissions rejects missing fields', async () => {
    const form = new FormData();
    form.append('dropdown1', 'option-a');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('POST /api/submissions accepts 3 dropdowns and a file', async () => {
    const form = new FormData();
    form.append('dropdown1', 'option-a');
    form.append('dropdown2', 'option-b');
    form.append('dropdown3', 'option-c');
    form.append('file', new Blob(['sample file content'], { type: 'text/plain' }), 'sample.txt');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.selections, {
      dropdown1: 'option-a',
      dropdown2: 'option-b',
      dropdown3: 'option-c',
    });
    assert.equal(body.file.originalName, 'sample.txt');
    assert.equal(body.file.size, 'sample file content'.length);
  });
});
