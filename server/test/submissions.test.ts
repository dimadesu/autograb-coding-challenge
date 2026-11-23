import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import app from '../src/app.ts';
import type { SubmissionResponse } from '../src/routes/submissions.ts';

interface ErrorResponse {
  error: string;
}

describe('API endpoints', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });

  it('GET /api/vehicles returns the vehicle catalog and common vehicles', async () => {
    const [expectedCatalog, expectedCommonVehicles]: unknown[] =
      await Promise.all([
        readFile(
          new URL('../data/vehicles.json', import.meta.url),
          'utf-8',
        ).then((raw) => JSON.parse(raw) as unknown),
        readFile(
          new URL('../data/common-vehicles.json', import.meta.url),
          'utf-8',
        ).then((raw) => JSON.parse(raw) as unknown),
      ]);
    const res = await fetch(`${baseUrl}/api/vehicles`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), {
      catalog: expectedCatalog,
      commonVehicles: expectedCommonVehicles,
    });
  });

  it('POST /api/submissions rejects missing fields', async () => {
    const form = new FormData();
    form.append('make', 'ford');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.ok(body.error);
  });

  it('POST /api/submissions rejects mismatched make/model/badge combinations', async () => {
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Model 3');
    form.append('badge', 'Performance');
    form.append(
      'logbook',
      new Blob(['Service entry 1'], { type: 'text/plain' }),
      'logbook.txt',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.match(body.error, /invalid make, model, and badge/i);
  });

  it('POST /api/submissions rejects prototype-key vehicle fields', async () => {
    const form = new FormData();
    form.append('make', 'toString');
    form.append('model', 'name');
    form.append('badge', 'to');
    form.append(
      'logbook',
      new Blob(['Service entry 1'], { type: 'text/plain' }),
      'logbook.txt',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.match(body.error, /invalid make, model, and badge/i);
  });

  it('POST /api/submissions rejects non-plain-text files', async () => {
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append(
      'logbook',
      new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      'logbook.pdf',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.match(body.error, /plain text/i);
  });

  it('POST /api/submissions accepts valid make/model/badge and plain text logbook', async () => {
    const logbookText =
      '2025-01-15: 15,000km service completed.\n2025-07-20: Oil and filter change.';
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append(
      'logbook',
      new Blob([logbookText], { type: 'text/plain' }),
      'ranger-logbook.txt',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as SubmissionResponse;
    assert.equal(body.make, 'ford');
    assert.equal(body.model, 'Ranger');
    assert.equal(body.badge, 'Raptor');
    assert.equal(body.logbook.fileName, 'ranger-logbook.txt');
    assert.equal(body.logbook.content, logbookText);
  });

  it('POST /api/submissions accepts plain text files with uncommon or no extensions', async () => {
    for (const fileName of ['service.log', 'service.notes', 'logbook']) {
      const form = new FormData();
      form.append('make', 'ford');
      form.append('model', 'Ranger');
      form.append('badge', 'Raptor');
      form.append(
        'logbook',
        new Blob(['Service entry'], { type: 'application/octet-stream' }),
        fileName,
      );

      const res = await fetch(`${baseUrl}/api/submissions`, {
        method: 'POST',
        body: form,
      });

      assert.equal(res.status, 200);
      const body = (await res.json()) as SubmissionResponse;
      assert.equal(body.logbook.fileName, fileName);
      assert.equal(body.logbook.content, 'Service entry');
    }
  });

  it('POST /api/submissions rejects binary files renamed to .txt', async () => {
    const binaryBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff,
    ]);
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append(
      'logbook',
      new Blob([binaryBytes], { type: 'text/plain' }),
      'fake.txt',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.match(body.error, /valid utf-8 plain text/i);
  });

  it('POST /api/submissions allows empty (0-byte) plain text files', async () => {
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append('logbook', new Blob([], { type: 'text/plain' }), 'empty.txt');

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as SubmissionResponse;
    assert.equal(body.logbook.size, 0);
    assert.equal(body.logbook.content, '');
  });

  it('POST /api/submissions rejects files larger than 5 MB', async () => {
    const oversized = 'a'.repeat(5 * 1024 * 1024 + 1);
    const form = new FormData();
    form.append('make', 'ford');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append(
      'logbook',
      new Blob([oversized], { type: 'text/plain' }),
      'huge.txt',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.match(body.error, /file too large/i);
  });

  it('POST /api/submissions rejects duplicate vehicle fields', async () => {
    const form = new FormData();
    form.append('make', 'ford');
    form.append('make', 'bmw');
    form.append('model', 'Ranger');
    form.append('badge', 'Raptor');
    form.append(
      'logbook',
      new Blob(['Service entry'], { type: 'text/plain' }),
      'logbook.txt',
    );

    const res = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      body: form,
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as ErrorResponse;
    assert.ok(body.error);
  });
});
