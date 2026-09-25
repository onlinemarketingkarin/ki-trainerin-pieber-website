/** Ein Fehler, den man dem Menschen im Cockpit zeigen darf. */
export class Fehler extends Error {
  constructor(status, meldung, details = []) {
    super(meldung);
    this.status = status;
    this.details = details;
  }
}
