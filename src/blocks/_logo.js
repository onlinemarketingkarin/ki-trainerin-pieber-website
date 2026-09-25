import { raw } from './_util.js';

/**
 * Sprechblase mit drei Punkten, nach der CI-Beschreibung. Die Punkte sind Löcher,
 * deshalb funktioniert das Zeichen auf jedem Hintergrund. Farbe: currentColor.
 * Dieselbe Form steckt in public/logo/ und public/favicon.svg.
 */
const ZEICHEN = 'M6 4H26a4 4 0 0 1 4 4V20a4 4 0 0 1-4 4H14l-7 6v-6H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z' +
  'M8 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM14 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0zM20 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z';

export const logoIcon = (klasse = '') => raw(
  `<svg class="${klasse}" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">` +
  `<path d="${ZEICHEN}" fill="currentColor" fill-rule="evenodd"/></svg>`);
