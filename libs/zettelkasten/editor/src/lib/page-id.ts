/**
 * The page id wiki_seite expects, derived from the evidence path of a hit:
 * "mandanten/bajour/wiki/personen/cramer_conradin.md" becomes
 * "personen/cramer_conradin.md". A path without "wiki/" is passed through.
 */
export function pageIdFromEvidence(evidence: string): string {
  const marker = '/wiki/';
  const index = evidence.indexOf(marker);

  return index === -1 ? evidence : evidence.slice(index + marker.length);
}
