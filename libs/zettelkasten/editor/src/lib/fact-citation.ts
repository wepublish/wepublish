import { DossierFact } from './dossier';

/**
 * The name of the source, without what parseDossier leaves standing beside it.
 * The quelle line carries the raw-store path and further remarks after commas;
 * the article names the source, the evidence stays in the panel.
 */
function sourceName(source: string): string {
  return source.split(',')[0].trim();
}

/**
 * The fact as it goes into the article: verbatim, with its source and the day
 * it was learned. Nothing is rephrased; the writer edits afterwards and the
 * evidence stays attached.
 */
export function formatFactCitation(
  fact: DossierFact,
  labels: { source: string; asOf: string }
): string {
  const parts: string[] = [];
  if (fact.source) {
    parts.push(`${labels.source}: ${sourceName(fact.source)}`);
  }
  if (fact.learnedAt) {
    parts.push(`${labels.asOf} ${fact.learnedAt}`);
  }
  if (fact.original) {
    parts.push(fact.original);
  }
  const quoted = `«${fact.statement}»`;
  return parts.length ? `${quoted} (${parts.join(', ')})` : quoted;
}
