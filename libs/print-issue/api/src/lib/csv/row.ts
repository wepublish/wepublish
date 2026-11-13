export type Quelle = 'wepublish' | 'bexio' | '';

/** One line of the print run: one address, `anzahl` copies. */
export type ExportRow = {
  quelle: Quelle;
  adressnummer: string;
  anrede: string;
  firma: string;
  vorname: string;
  name: string;
  zusatz: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  land: string;
  anzahl: number;
  aboTyp: string;
  zahlungsstatus: string;
  beginn: string;
  email: string;
  bemerkungen: string;
  hinweis: string;
};

export const emptyRow = (): ExportRow => ({
  quelle: '',
  adressnummer: '',
  anrede: '',
  firma: '',
  vorname: '',
  name: '',
  zusatz: '',
  strasse: '',
  hausnummer: '',
  plz: '',
  ort: '',
  land: '',
  anzahl: 1,
  aboTyp: '',
  zahlungsstatus: '',
  beginn: '',
  email: '',
  bemerkungen: '',
  hinweis: '',
});
