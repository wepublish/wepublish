export const isContentEditorRoute = (pathname: string) =>
  /\/(edit|create)(\/|$)/.test(pathname);
