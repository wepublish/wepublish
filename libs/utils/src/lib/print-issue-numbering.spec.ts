import {
  DEFAULT_ISSUE_NUMBERING,
  formatIssueLabel,
  issueFileLabel,
  issueNumberingOf,
  LABEL_FORMAT_PRESETS,
  parseIssueLabel,
  validateLabelFormat,
} from './print-issue-numbering';

const single = { number: 6, year: 2026 };
const double = { number: 3, numberTo: 4, year: 2026 };
const zwoelf = { number: 117, year: 2026 };
const zwoelfDouble = { number: 117, numberTo: 118, year: 2026 };

describe('formatIssueLabel', () => {
  it('writes the Neue Wege form by default', () => {
    expect(formatIssueLabel(single)).toBe('6.26');
    expect(formatIssueLabel(double)).toBe('3/4.26');
  });

  it('follows the medium’s template', () => {
    expect(formatIssueLabel(zwoelf, '#{range}')).toBe('#117');
    expect(formatIssueLabel(zwoelfDouble, '#{range}')).toBe('#117/118');
    expect(formatIssueLabel(single, 'Nr. {range}/{yyyy}')).toBe('Nr. 6/2026');
    expect(formatIssueLabel(double, 'Nr. {number} ({yyyy})')).toBe(
      'Nr. 3 (2026)'
    );
  });

  it('offers the three presets', () => {
    expect(LABEL_FORMAT_PRESETS.map(f => formatIssueLabel(single, f))).toEqual(
      ['6.26', '#6', 'Nr. 6/2026']
    );
  });
});

describe('issueFileLabel', () => {
  it('keeps the label safe for a file name', () => {
    expect(issueFileLabel('6.26')).toBe('6.26');
    expect(issueFileLabel('3/4.26')).toBe('3-4.26');
    expect(issueFileLabel('#117')).toBe('117');
    expect(issueFileLabel('#117/118')).toBe('117-118');
    expect(issueFileLabel('Nr. 6/2026')).toBe('Nr.-6-2026');
  });
});

describe('validateLabelFormat', () => {
  it('accepts the presets for the counting they fit', () => {
    expect(validateLabelFormat('{range}.{yy}', 'perYear')).toEqual([]);
    expect(validateLabelFormat('#{range}', 'continuous')).toEqual([]);
    expect(validateLabelFormat('Nr. {range}/{yyyy}', 'perYear')).toEqual([]);
  });

  it('needs the year while numbers restart every year', () => {
    expect(validateLabelFormat('#{range}', 'perYear')).toEqual(['noYear']);
  });

  it('needs a number, known placeholders and a short text', () => {
    expect(validateLabelFormat('{yy}', 'continuous')).toEqual(['noNumber']);
    expect(validateLabelFormat('#{range} {month}', 'continuous')).toEqual([
      'unknownPlaceholder',
    ]);
    expect(validateLabelFormat(`#{range}${'x'.repeat(40)}`, 'continuous')).toEqual(
      ['tooLong']
    );
    expect(validateLabelFormat('', 'continuous')).toEqual(['noNumber']);
  });
});

describe('issueNumberingOf', () => {
  it('reads both settings, falling back for anything invalid', () => {
    expect(issueNumberingOf('continuous', '#{range}')).toEqual({
      counting: 'continuous',
      format: '#{range}',
    });
    expect(issueNumberingOf(undefined, undefined)).toEqual(
      DEFAULT_ISSUE_NUMBERING
    );
    expect(issueNumberingOf('nonsense', 42)).toEqual(DEFAULT_ISSUE_NUMBERING);
    // a template that does not fit the counting falls back to the default
    expect(issueNumberingOf('perYear', '#{range}')).toEqual(
      DEFAULT_ISSUE_NUMBERING
    );
    expect(issueNumberingOf('continuous', '{yy}')).toEqual({
      counting: 'continuous',
      format: '#{range}',
    });
  });
});

describe('parseIssueLabel', () => {
  it('reads what the Neue Wege form accepted before', () => {
    for (const [text, parsed] of [
      ['6.26', { from: 6, to: 6, year: 2026 }],
      ['06.26', { from: 6, to: 6, year: 2026 }],
      ['6/26', { from: 6, to: 6, year: 2026 }],
      ['3/4.26', { from: 3, to: 4, year: 2026 }],
      ['3-4.26', { from: 3, to: 4, year: 2026 }],
      ['3/4/26', { from: 3, to: 4, year: 2026 }],
      [' 6.26 ', { from: 6, to: 6, year: 2026 }],
    ] as const) {
      expect(parseIssueLabel(text, '{range}.{yy}')).toEqual(parsed);
    }
  });

  it('reads a continuous number with or without its sign', () => {
    for (const [text, parsed] of [
      ['#117', { from: 117, to: 117, year: null }],
      ['117', { from: 117, to: 117, year: null }],
      ['# 117', { from: 117, to: 117, year: null }],
      ['#117/118', { from: 117, to: 118, year: null }],
      ['117-118', { from: 117, to: 118, year: null }],
    ] as const) {
      expect(parseIssueLabel(text, '#{range}')).toEqual(parsed);
    }
  });

  it('reads a label with words and a four-digit year', () => {
    expect(parseIssueLabel('Nr. 6/2026', 'Nr. {range}/{yyyy}')).toEqual({
      from: 6,
      to: 6,
      year: 2026,
    });
  });

  it('reads the label at the start of a longer text', () => {
    expect(parseIssueLabel('#117 (Doppelt bestellt)', '#{range}')).toEqual({
      from: 117,
      to: 117,
      year: null,
    });
  });

  it('refuses anything else', () => {
    for (const text of [
      '',
      'Heft',
      'abc',
      '6',
      '6.2',
      '6.2026',
      '2026',
      '31.12.2026',
      '4/3.26',
      '3/3.26',
      '0.26',
      '0/1.26',
    ]) {
      expect(parseIssueLabel(text, '{range}.{yy}')).toBeNull();
    }
    expect(parseIssueLabel('#1170', '#{range}')).toEqual({
      from: 1170,
      to: 1170,
      year: null,
    });
    expect(parseIssueLabel('Nr. 6', 'Nr. {range}/{yyyy}')).toBeNull();
  });
});
