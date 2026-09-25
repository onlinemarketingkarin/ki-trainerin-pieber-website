import nav from './nav.js';
import hero from './hero.js';
import richtext from './richtext.js';
import cards from './cards.js';
import cta from './cta.js';
import schritte from './schritte.js';
import person from './person.js';
import faq from './faq.js';
import kontaktkarte from './kontaktkarte.js';
import formular from './formular.js';
import footer from './footer.js';

/** Registry. Ein neuer Baustein ist eine Datei plus eine Zeile hier. */
export const blocks = Object.fromEntries([nav, hero, richtext, cards, schritte, person, faq, kontaktkarte, formular, cta, footer].map((b) => [b.name, b]));
