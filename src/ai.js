/**
 * Dünner Modell-Client. Eine Datei, die weiß, wie man Claude aufruft — der Rest
 * des Codes kennt nur `aufrufen({ system, prompt })`. `client` ist einspeisbar
 * (Tests laufen ganz ohne API-Schlüssel und ohne Netz).
 */
const MODELL = 'claude-sonnet-5';

export async function rufeModell({ system, prompt, model = MODELL, client }) {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt. Ohne Schlüssel kann der Generator nicht arbeiten.');
    }
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    client = new Anthropic();
  }
  const antwort = await client.messages.create({
    model,
    // Ohne dies zieht Claude Sonnet 5 bei diesem Prompt-Umfang das gesamte Token-Budget fürs
    // interne "Thinking" heran und liefert null Text-Blöcke (stop_reason "max_tokens", leere
    // Antwort) — beobachtet und nachgestellt am 25.09. Für eine reine Baustein-Befüllung nach
    // festem Schema ist Thinking ohnehin unnötig.
    thinking: { type: 'disabled' },
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return antwort.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}
