import { EmailQualityLevel, PrismaClient } from '@prisma/client';
import {
  emailSegmentOf,
  emailSegmentWhere,
  MailEmailSegment,
  placeholderEmailPatterns,
  placeholderEmailWhere,
  realEmailWhere,
} from './email-segment';

const PATTERN = '@placeholder.neuewege.ch';

describe('placeholderEmailPatterns', () => {
  it('reads the trimmed, non-empty patterns of the letter integrations', async () => {
    const prisma = {
      settingLetterProvider: {
        findMany: vi.fn(async () => [
          { placeholderEmailContains: ` ${PATTERN} ` },
          { placeholderEmailContains: null },
          { placeholderEmailContains: '  ' },
        ]),
      },
    } as unknown as PrismaClient;

    expect(await placeholderEmailPatterns(prisma)).toEqual([PATTERN]);
  });
});

describe('placeholderEmailWhere / realEmailWhere', () => {
  it('never builds an empty OR or AND without patterns', () => {
    expect(placeholderEmailWhere([])).toBeNull();
    expect(realEmailWhere([])).toEqual({});
  });

  it('matches and excludes the patterns case-insensitively', () => {
    expect(placeholderEmailWhere([PATTERN])).toEqual({
      OR: [{ email: { contains: PATTERN, mode: 'insensitive' } }],
    });
    expect(realEmailWhere([PATTERN])).toEqual({
      AND: [{ email: { mode: 'insensitive', not: { contains: PATTERN } } }],
    });
  });
});

describe('emailSegmentWhere', () => {
  it('does not restrict when nothing is picked', () => {
    expect(emailSegmentWhere([], [PATTERN])).toEqual({});
  });

  it('matches nobody for the placeholder segment without patterns', () => {
    expect(emailSegmentWhere([MailEmailSegment.placeholder], [])).toEqual({
      id: { in: [] },
    });
  });

  it('counts people never evaluated as unknown', () => {
    expect(emailSegmentWhere([MailEmailSegment.unknown], [])).toEqual({
      AND: [
        {},
        {
          OR: [
            {
              emailQuality: {
                is: { level: { in: [EmailQualityLevel.unknown] } },
              },
            },
            { emailQuality: { is: null } },
          ],
        },
      ],
    });
  });

  it('keeps generated addresses out of the level segments', () => {
    expect(emailSegmentWhere([MailEmailSegment.dead], [PATTERN])).toEqual({
      AND: [
        realEmailWhere([PATTERN]),
        {
          OR: [
            {
              emailQuality: { is: { level: { in: [EmailQualityLevel.dead] } } },
            },
          ],
        },
      ],
    });
  });

  it('is any of several picked segments', () => {
    expect(
      emailSegmentWhere(
        [MailEmailSegment.placeholder, MailEmailSegment.dead],
        [PATTERN]
      )
    ).toEqual({
      OR: [
        placeholderEmailWhere([PATTERN]),
        emailSegmentWhere([MailEmailSegment.dead], [PATTERN]),
      ],
    });
  });
});

describe('emailSegmentOf', () => {
  it('prefers the placeholder pattern over the stored level', () => {
    expect(
      emailSegmentOf(
        {
          email: 'NW-1@Placeholder.neuewege.ch',
          emailQuality: { level: 'dead' },
        },
        [PATTERN]
      )
    ).toBe(MailEmailSegment.placeholder);
  });

  it('is unknown without a stored level', () => {
    expect(
      emailSegmentOf({ email: 'jane@example.com', emailQuality: null }, [])
    ).toBe(MailEmailSegment.unknown);
  });
});
