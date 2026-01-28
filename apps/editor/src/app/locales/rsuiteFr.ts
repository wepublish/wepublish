const Calendar = {
  sunday: 'Su',
  monday: 'Mo',
  tuesday: 'Tu',
  wednesday: 'We',
  thursday: 'Th',
  friday: 'Fr',
  saturday: 'Sa',
  ok: 'OK',
  today: "Aujourd'hui",
  yesterday: 'Hier',
  hours: 'Heures',
  minutes: 'Minutes',
  seconds: 'Secondes',
  /**
   * Format of the string is based on Unicode Technical Standard #35:
   * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
   **/
  formattedMonthPattern: 'MMM yyyy',
  formattedDayPattern: 'dd MMM yyyy',
};

export default {
  Pagination: {
    first: 'Première',
    last: 'Dernière',
    limit: '{0} / page',
    more: 'Plus',
    next: 'Suivante',
    prev: 'Précédente',
    skip: 'Aller à la page {0}',
    total: 'Total: {0}',
  },
  Table: {
    emptyMessage: 'Aucune donnée trouvée',
    loading: 'Chargement...',
  },
  TablePagination: {
    lengthMenuInfo: '{0} / page',
    totalInfo: 'Total: {0}',
  },
  Calendar,
  DatePicker: {
    ...Calendar,
  },
  DateRangePicker: {
    ...Calendar,
    last7Days: '7 derniers jours',
  },
  Picker: {
    noResultsText: 'Aucun résultat trouvé',
    placeholder: 'Sélectionner',
    searchPlaceholder: 'Recherche',
    checkAll: 'All',
  },
  InputPicker: {
    newItem: 'Noveau',
    createOption: 'Créer l\'option "{0}"',
  },
  Uploader: {
    inited: 'Initial',
    progress: 'Uploading',
    error: 'Erreur',
    complete: 'Terminé',
    emptyFile: 'Vide',
    upload: 'Upload',
  },
};
