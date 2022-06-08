const Calendar = {
  sunday: 'Su',
  monday: 'Mo',
  tuesday: 'Tu',
  wednesday: 'We',
  thursday: 'Th',
  friday: 'Fr',
  saturday: 'Sa',
  ok: 'OK',
  today: 'Today',
  yesterday: 'Yesterday',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  /**
   * Format of the string is based on Unicode Technical Standard #35:
   * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
   **/
  formattedMonthPattern: 'MMM YYYY',
  formattedDayPattern: 'DD MMM YYYY'
}

export default {
  Pagination: {
    first: 'First',
    last: 'Last',
    limit: '{0} / page',
    more: 'More',
    next: 'Next',
    prev: 'Previous',
    skip: 'Go to{0}',
    total: 'Total Rows: {0}'
  },
  Table: {
    emptyMessage: 'Keine Daten gefunden',
    loading: 'Loading...'
  },
  TablePagination: {
    lengthMenuInfo: '{0} / page',
    totalInfo: 'Total: {0}'
  },
  Calendar,
  DatePicker: {
    ...Calendar
  },
  DateRangePicker: {
    ...Calendar,
    last7Days: 'Last 7 Days'
  },
  Picker: {
    noResultsText: 'Kein Ergebnis',
    placeholder: 'Auswählen',
    searchPlaceholder: 'Suchen',
    checkAll: 'All'
  },
  InputPicker: {
    newItem: 'New item',
    createOption: 'Create option "{0}"'
  },
  Uploader: {
    inited: 'Initial',
    progress: 'Uploading',
    error: 'Error',
    complete: 'Finished',
    emptyFile: 'Empty',
    upload: 'Upload'
  }
}
