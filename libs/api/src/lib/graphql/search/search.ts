import {PrismaClient} from '@prisma/client'

export class Search {
  /**
   * Find all articles where the query has a match in the body
   * @param prisma the Prisma client
   * @param query the user supplied search query
   * @returns a list of article ids that match the search query
   */
  static async searchArticles(prisma: PrismaClient, query: string): Promise<string[]> {
    const results = await prisma.$queryRaw<{id: string}[]>`
      SELECT a.id FROM articles a
      JOIN public."articles.revisions" ar on a."publishedId" = ar.id
      WHERE to_tsvector('english', ar.title) ||  jsonb_to_tsvector(
        'english',
        jsonb_path_query_array(ar.blocks, 'strict $.**.text'),
        '["string"]'
        )@@ to_tsquery('english', ${this.transformQuery(query)});`
    return results.map(({id}) => id)
  }

  /**
   * Find all pages where the query has a match in the body
   * @param prisma the Prisma client
   * @param query the user supplied search query
   * @returns a list of page ids that match the search query
   */
  static async searchPages(prisma: PrismaClient, query: string): Promise<string[]> {
    const results = await prisma.$queryRaw<{id: string}[]>`
      SELECT p.id FROM pages p
      JOIN public."pages.revisions" pr on p."publishedId" = pr.id
      WHERE to_tsvector('english', pr.title) ||  jsonb_to_tsvector(
        'english',
        jsonb_path_query_array(blocks, 'strict $.**.text'),
        '["string"]'
        )@@ to_tsquery('english', ${this.transformQuery(query)});`
    return results.map(({id}) => id)
  }

  private static transformQuery(query: string): string {
    // Replace spaces with & to create valid PostgreSQL search syntax
    return query.replace(/\s+/g, '&')
  }
}
