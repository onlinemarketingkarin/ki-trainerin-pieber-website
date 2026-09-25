/**
 * Benachrichtigung über eine neue Anfrage. Die Mail ist nachrangig (P6): die Anfrage liegt
 * längst in der Tabelle, wenn hier etwas schiefgeht. Ohne SMTP_URL wird nichts verschickt,
 * und der Aufrufer protokolliert das laut, ohne die Anfrage zu verlieren.
 */
export const INTERESSEN = { coaching: '1:1-Coaching', team: 'Teamtraining', bildung: 'Bildung und Lehre', gesundheit: 'Gesundheitswesen', vortrag: 'Vortrag' };
export const interesseLabel = (schluessel) => INTERESSEN[schluessel] || '';
export const INTERESSEN_SCHLUESSEL = Object.keys(INTERESSEN);

export function baueMail(daten, facts, env = process.env) {
  const interesse = interesseLabel(daten.interesse) || 'keine Angabe';
  return {
    from: env.MAIL_FROM || facts.email,
    to: facts.email,
    replyTo: daten.email,
    subject: `Neue Anfrage: ${interesse}`,
    text: [
      `Name: ${daten.name}`,
      `E-Mail: ${daten.email}`,
      `Organisation: ${daten.organisation || '-'}`,
      `Interesse: ${interesse}`,
      `Seite: ${daten.seite || '-'}`,
      '',
      daten.nachricht,
    ].join('\n'),
  };
}

/** `transport` ist einspeisbar, damit sich der Versand ohne Server testen lässt. */
export async function benachrichtige(daten, facts, { transport, env = process.env } = {}) {
  if (!transport) {
    if (!env.SMTP_URL) throw new Error('SMTP_URL ist nicht gesetzt, es wurde keine Mail verschickt');
    const nodemailer = (await import('nodemailer')).default;
    transport = nodemailer.createTransport(env.SMTP_URL);
  }
  await transport.sendMail(baueMail(daten, facts, env));
}
