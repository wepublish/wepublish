export default class Pagination {
  public currentPage: number
  public totalPages: number

  constructor({currentPage, totalPages}: {currentPage?: number; totalPages?: number}) {
    this.currentPage = currentPage || 1
    this.totalPages = totalPages || 0
  }

  public update({
    currentPage,
    totalPages
  }: {
    currentPage?: number
    nextIntendedPage?: number
    totalPages?: number
  }) {
    if (currentPage) {
      this.currentPage = currentPage
    }
    if (totalPages) {
      this.totalPages = totalPages
    }
  }

  public goToPage(page: number): void {
    if (page < 0) {
      return
    }
    if (page > this.totalPages) {
      return
    }
    this.currentPage = page
  }
}
