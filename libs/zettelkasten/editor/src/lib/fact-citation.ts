import { DossierFact } from './dossier';

/**
 * The fact as it goes into the article: verbatim, with its source and the day
 * it was learned. Nothing is rephrased; the writer edits afterwards and the
 * evidence stays attached. The source is the name parseDossier kept, never the
 * raw-store path: without a name the citation carries no source at all.
 */
export function formatFactCitation(
  fact: DossierFact,
  labels: { source: string; asOf: string }
): string {
  const parts: string[] = [];
  if (fact.sourceName) {
    parts.push(`${labels.source}: ${fact.sourceName}`);
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
