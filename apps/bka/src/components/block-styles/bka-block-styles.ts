export enum BkaBlockStyle {
  Magazin = 'Magazin',
  Empfehlung = 'Empfehlung',
  Archiv = 'Archiv',
  Mitglied = 'Mitglied',
  Abo = 'Abo',
  Newsletter = 'Newsletter',
  Dokumentationen = 'Dokumentationen',
}

export const BKA_SIDEBAR_BLOCK_STYLES: string[] = [
  BkaBlockStyle.Mitglied,
  BkaBlockStyle.Abo,
  BkaBlockStyle.Newsletter,
  BkaBlockStyle.Dokumentationen,
];
