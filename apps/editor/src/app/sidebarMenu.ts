export function onlyLatestOpen(previous: string[], next: string[]) {
  const opened = next.filter(key => !previous.includes(key));

  return opened.length ? opened.slice(-1) : next;
}
