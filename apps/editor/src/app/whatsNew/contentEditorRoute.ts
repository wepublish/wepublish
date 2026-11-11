/**
 * The pages where people write: article, page, template and other editors.
 * Changelog bars stay out of those so they never push the content down.
 */
export const isContentEditorRoute = (pathname: string) =>
  /\/(edit|create)(\/|$)/.test(pathname);
