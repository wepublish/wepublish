export function stripHtml(input: string) {
  return input.replace(/(<([^>]+)>)/gi, '')
}
