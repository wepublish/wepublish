/**
 * A fact as the Zettelkasten writes it (schema/fakt_format.md): one statement,
 * the two times, the source with its raw-store path, an optional origin and a
 * status. Parsed by shape, never interpreted.
 */
export type DossierFact = {
  statement: string;
  validFrom?: string;
  validTo?: string;
  learnedAt?: string;
  source?: string;
  /** The raw-store path inside the source line, zip entry included. */
  evidence?: string;
  /** The address of the original document, for official publications. */
  original?: string;
  /** "haus" or "community" when the fact did not come from a register. */
  origin?: string;
  status?: string;
  /** True while the status line says gueltig. */
  valid: boolean;
};

export type DossierSection = {
  title: string;
  notes: string[];
  facts: DossierFact[];
};

export type Dossier = {
  meta: Record<string, string>;
  sections: DossierSection[];
};

const EVIDENCE = /rohablage\/[^\s,]+(?: :: [^\s,]+)?/;
const ORIGINAL = /Original (https?:\/\/\S+)/;

const emptyFact = (statement: string): DossierFact => ({
  statement,
  valid: true,
});

/** Parses the markdown of a wiki page into its head, sections and facts. */
export function parseDossier(inhalt: string): Dossier {
  const lines = inhalt.split('\n');
  const meta: Record<string, string> = {};
  const sections: DossierSection[] = [];
  let section: DossierSection | undefined;
  let fact: DossierFact | undefined;
  let index = 0;

  if (lines[0]?.trim() === '---') {
    index = 1;
    while (index < lines.length && lines[index].trim() !== '---') {
      const match = /^([a-z_]+):\s*(.*)$/.exec(lines[index]);
      if (match) {
        meta[match[1]] = match[2].trim();
      }
      index++;
    }
    index++;
  }

  for (; index < lines.length; index++) {
    const line = lines[index];

    if (line.startsWith('## ')) {
      section = { title: line.slice(3).trim(), notes: [], facts: [] };
      sections.push(section);
      fact = undefined;
      continue;
    }

    if (!section || line.startsWith('# ')) {
      continue;
    }

    if (line.startsWith('- ')) {
      fact = emptyFact(line.slice(2).trim());
      section.facts.push(fact);
      continue;
    }

    const field = /^\s+([a-z_]+):\s*(.*)$/.exec(line);

    if (fact && field) {
      const [, key, value] = field;

      if (key === 'gueltig') {
        const times = /^(.*?) bis (.*?)(?: \| erfahren: (.*))?$/.exec(value);
        fact.validFrom = times?.[1].trim();
        fact.validTo = times?.[2].trim();
        fact.learnedAt = times?.[3]?.trim();
      } else if (key === 'quelle') {
        fact.source = value;
        fact.evidence = EVIDENCE.exec(value)?.[0];
        fact.original = ORIGINAL.exec(value)?.[1];
      } else if (key === 'herkunft') {
        fact.origin = value;
      } else if (key === 'status') {
        fact.status = value;
        fact.valid = value.startsWith('gueltig');
      }
      continue;
    }

    if (!fact && line.trim()) {
      section.notes.push(line.trim());
    }
  }

  return { meta, sections };
}

/** The path quelle_zeigen wants: the raw-store path without the zip entry. */
export function evidenceOf(evidence: string): string {
  return evidence.split(' :: ')[0];
}

/** The phrase a statement quotes in guillemets, to be verified against the evidence. */
export function quotedPhrase(statement: string): string | undefined {
  return /«([^»]+)»/.exec(statement)?.[1];
}
