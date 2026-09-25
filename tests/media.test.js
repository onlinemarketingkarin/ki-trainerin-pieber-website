import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'motor-uploads-'));
const { verarbeiteBild, BREITEN } = await import('../src/media.js');
const { UPLOADS } = await import('../src/paths.js');

test('Bild wird zu WebP in drei Breiten, Name trägt den Hash', async () => {
  const png = await sharp({ create: { width: 1000, height: 700, channels: 3, background: '#B5451B' } }).png().toBuffer();
  const { base } = await verarbeiteBild(png, 'Mein Foto (1).PNG');
  assert.match(base, /^\/uploads\/[0-9a-f]{8}-mein-foto-1$/);
  for (const w of BREITEN) assert.ok(existsSync(join(UPLOADS, `${base.split('/').pop()}-${w}.webp`)), `${w}`);
  const klein = await sharp(join(UPLOADS, `${base.split('/').pop()}-480.webp`)).metadata();
  assert.equal(klein.format, 'webp');
  assert.equal(klein.width, 480);
  const gross = await sharp(join(UPLOADS, `${base.split('/').pop()}-1200.webp`)).metadata();
  assert.equal(gross.width, 1000, 'kleine Originale werden nicht hochgerechnet');
  assert.equal(readdirSync(UPLOADS).length, 3);
});

test('Gleiches Bild, gleicher Name: der Hash ändert sich mit dem Inhalt', async () => {
  const a = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).png().toBuffer();
  const b = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).png().toBuffer();
  assert.notEqual((await verarbeiteBild(a, 'x.png')).base, (await verarbeiteBild(b, 'x.png')).base);
});
