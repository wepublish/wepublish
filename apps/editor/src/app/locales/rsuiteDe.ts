const Calendar = {
  sunday: 'Su',
  monday: 'Mo',
  tuesday: 'Tu',
  wednesday: 'We',
  thursday: 'Th',
  friday: 'Fr',
  saturday: 'Sa',
  ok: 'OK',
  today: 'Heute',
  yesterday: 'Gestern',
  hours: 'Stunden',
  minutes: 'Minuten',
  seconds: 'Sekunden',
  /**
   * Format of the string is based on Unicode Technical Standard #35:
   * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
   **/
  formattedMonthPattern: 'MMM yyyy',
  formattedDayPattern: 'dd MMM yyyy',
};

export default {
  Pagination: {
    first: 'Erste',
    last: 'Letzte',
    limit: '{0} / Seite',
    more: 'Mehr',
    next: 'Nächste',
    prev: 'Vorherige',
    skip: 'Gehe zu {0}',
    total: 'Total: {0}',
  },
  Table: {
    emptyMessage: 'Keine Daten gefunden',
    loading: 'Lade...',
  },
  TablePagination: {
    lengthMenuInfo: '{0} / Seite',
    totalInfo: 'Total: {0}',
  },
  Calendar,
  DatePicker: {
    ...Calendar,
  },
  DateRangePicker: {
    ...Calendar,
    last7Days: 'Letzte 7 Tage',
  },
  Picker: {
    noResultsText: 'Kein Ergebnis',
    placeholder: 'Auswählen',
    searchPlaceholder: 'Suchen',
    checkAll: 'Alle',
  },
  InputPicker: {
    newItem: 'Neuer Eintrag',
    createOption: 'Erstelle Option "{0}"',
  },
  Uploader: {
    inited: 'Start',
    progress: 'Lädt hoch',
    error: 'Fehler',
    complete: 'Beendet',
    emptyFile: 'Leer',
    upload: 'Upload',
  },
};
