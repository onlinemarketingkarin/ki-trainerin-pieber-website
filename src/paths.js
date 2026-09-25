import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Projektwurzel, unabhängig vom Ordner, aus dem `node` gestartet wird. */
export const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Hochgeladene Bilder. Im Betrieb ein dauerhaftes Volume (UPLOAD_DIR), nie das Repository. */
export const UPLOADS = resolve(ROOT, process.env.UPLOAD_DIR || 'data/uploads');
