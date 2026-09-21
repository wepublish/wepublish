import { mkdtempSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  composeChangelogMarkdown,
  parseGenerationResult,
  writeGeneratedChangelog,
} from './generate-changelog';
import { parseChangelogMarkdown } from './parse-changelog-markdown';

const validReply = {
  slug: 'new_paywall',
  actionRequired: true,
  entries: {
    en: {
      title: 'New paywall',
      lead: 'A new paywall is available.',
      description: 'Pick it under **Paywalls**.',
    },
    de: {
      title: 'Neue Paywall',
      lead: 'Eine neue Paywall ist verfügbar.',
      description: null,
    },
    fr: {
      title: 'Nouveau paywall',
      lead: 'Un nouveau paywall est disponible.',
      description: null,
    },
  },
};

describe('parseGenerationResult', () => {
  it('parses a plain JSON reply', () => {
    const result = parseGenerationResult(JSON.stringify(validReply));

    expect(result).toMatchObject({
      slug: 'new_paywall',
      actionRequired: true,
    });
  });

  it('parses a reply wrapped in a code fence', () => {
    const result = parseGenerationResult(
      '```json\n' + JSON.stringify(validReply) + '\n```'
    );

    expect(result).toMatchObject({ slug: 'new_paywall' });
  });

  it('normalizes whitespace in titles and leads', () => {
    const result = parseGenerationResult(
      JSON.stringify({
        ...validReply,
        entries: {
          en: {
            title: '  New\npaywall ',
            lead: ' A new paywall\nis available. ',
            description: '  ',
          },
        },
      })
    );

    expect(result).toMatchObject({
      entries: {
        en: {
          title: 'New paywall',
          lead: 'A new paywall is available.',
          description: null,
        },
      },
    });
  });

  it('returns the skip decision', () => {
    expect(
      parseGenerationResult('{"skip": true, "reason": "internal refactoring"}')
    ).toEqual({ skip: true, reason: 'internal refactoring' });
  });

  it('rejects non-JSON replies', () => {
    expect(() => parseGenerationResult('Sure! Here is your changelog')).toThrow(
      /did not reply with valid JSON/
    );
  });

  it('rejects replies without the base locale', () => {
    expect(() =>
      parseGenerationResult(
        JSON.stringify({
          ...validReply,
          entries: { de: validReply.entries.de },
        })
      )
    ).toThrow(/missing the "en" entry/);
  });

  it('rejects unsupported locales', () => {
    expect(() =>
      parseGenerationResult(
        JSON.stringify({
          ...validReply,
          entries: { ...validReply.entries, es: validReply.entries.en },
        })
      )
    ).toThrow(/unsupported locale "es"/);
  });

  it('rejects entries without a title or lead', () => {
    expect(() =>
      parseGenerationResult(
        JSON.stringify({
          ...validReply,
          entries: { en: { title: 'Only a title' } },
        })
      )
    ).toThrow(/invalid entry for locale "en"/);
  });
});

describe('composeChangelogMarkdown', () => {
  it('round-trips through the sync parser', () => {
    const markdown = composeChangelogMarkdown(
      {
        title: 'New paywall',
        lead: 'A new paywall is available.',
        description: 'Pick it under **Paywalls**.',
      },
      true
    );

    expect(parseChangelogMarkdown(markdown)).toEqual({
      title: 'New paywall',
      lead: 'A new paywall is available.',
      actionRequired: true,
      description: 'Pick it under **Paywalls**.',
    });
  });

  it('omits actionRequired and description when not provided', () => {
    const markdown = composeChangelogMarkdown({
      title: 'A title',
      lead: 'A lead',
      description: null,
    });

    expect(parseChangelogMarkdown(markdown)).toEqual({
      title: 'A title',
      lead: 'A lead',
      actionRequired: false,
      description: null,
    });
  });
});

describe('writeGeneratedChangelog', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'generate-changelog-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('writes base and translation files that the sync accepts', async () => {
    const { folderName, files, entry } = await writeGeneratedChangelog(
      directory,
      validReply,
      new Date(Date.UTC(2026, 7, 25, 9, 0, 0))
    );

    expect(folderName).toBe('20260825090000_new_paywall');
    expect(files.map(file => path.basename(file)).sort()).toEqual([
      'changelog.de.md',
      'changelog.fr.md',
      'changelog.md',
    ]);
    expect(entry).toMatchObject({
      title: 'New paywall',
      actionRequired: true,
      translations: [
        expect.objectContaining({ locale: 'de', title: 'Neue Paywall' }),
        expect.objectContaining({ locale: 'fr', title: 'Nouveau paywall' }),
      ],
    });
  });
});
