import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { UPLOADS } from './paths.js';

export const BREITEN = [480, 800, 1200];

const slug = (name) => String(name || '')
  .toLowerCase().replace(/\.[a-z0-9]+$/, '').normalize('NFKD')
  .replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'bild';

/**
 * Bild → WebP in mehreren Breiten. Der Dateiname trägt den Inhalts-Hash, damit
 * ein getauschtes Bild nie gegen den Browser-Cache kämpft. Liefert den Basispfad,
 * aus dem `bildSet()` das srcset baut: /uploads/<hash>-<name>-<breite>.webp
 */
export async function verarbeiteBild(buffer, dateiname) {
  const basis = `${createHash('sha1').update(buffer).digest('hex').slice(0, 8)}-${slug(dateiname)}`;
  await mkdir(UPLOADS, { recursive: true });
  for (const breite of BREITEN) {
    const webp = await sharp(buffer).rotate()
      .resize({ width: breite, withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    await writeFile(join(UPLOADS, `${basis}-${breite}.webp`), webp);
  }
  return { base: `/uploads/${basis}`, breiten: BREITEN };
}
