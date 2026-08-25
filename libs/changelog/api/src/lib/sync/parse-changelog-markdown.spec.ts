import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  inlineChangelogImages,
  parseChangelogMarkdown,
} from './parse-changelog-markdown';

describe('parseChangelogMarkdown', () => {
  it('parses frontmatter and description', () => {
    const result = parseChangelogMarkdown(
      [
        '---',
        'title: New landing page block',
        'lead: You can now add a landing page block.',
        'actionRequired: true',
        '---',
        '',
        'Some **longer** description with a [link](https://wepublish.ch).',
      ].join('\n')
    );

    expect(result).toEqual({
      title: 'New landing page block',
      lead: 'You can now add a landing page block.',
      actionRequired: true,
      description:
        'Some **longer** description with a [link](https://wepublish.ch).',
    });
  });

  it('defaults actionRequired to false and description to null', () => {
    const result = parseChangelogMarkdown(
      ['---', 'title: A title', 'lead: A lead', '---', ''].join('\n')
    );

    expect(result).toEqual({
      title: 'A title',
      lead: 'A lead',
      actionRequired: false,
      description: null,
    });
  });

  it('strips surrounding quotes from values', () => {
    const result = parseChangelogMarkdown(
      ['---', 'title: "Quoted: title"', "lead: 'Quoted lead'", '---'].join('\n')
    );

    expect(result.title).toBe('Quoted: title');
    expect(result.lead).toBe('Quoted lead');
  });

  it('handles windows line endings', () => {
    const result = parseChangelogMarkdown(
      ['---', 'title: A title', 'lead: A lead', '---', 'Description'].join(
        '\r\n'
      )
    );

    expect(result.title).toBe('A title');
    expect(result.description).toBe('Description');
  });

  it('throws when the frontmatter is missing', () => {
    expect(() => parseChangelogMarkdown('# Just markdown')).toThrow(
      /has to start with/
    );
  });

  it('throws when the frontmatter is never closed', () => {
    expect(() =>
      parseChangelogMarkdown(['---', 'title: A title'].join('\n'))
    ).toThrow(/never closed/);
  });

  it('throws on unknown frontmatter keys', () => {
    expect(() =>
      parseChangelogMarkdown(
        ['---', 'title: A title', 'lead: A lead', 'foo: bar', '---'].join('\n')
      )
    ).toThrow(/Unknown changelog frontmatter key "foo"/);
  });

  it('throws on typos of actionRequired instead of silently ignoring them', () => {
    expect(() =>
      parseChangelogMarkdown(
        [
          '---',
          'title: A title',
          'lead: A lead',
          'actionRequried: true',
          '---',
        ].join('\n')
      )
    ).toThrow(/Unknown changelog frontmatter key/);
  });

  it('throws on duplicate frontmatter keys', () => {
    expect(() =>
      parseChangelogMarkdown(
        ['---', 'title: A title', 'title: Another', 'lead: A lead', '---'].join(
          '\n'
        )
      )
    ).toThrow(/Duplicate changelog frontmatter key "title"/);
  });

  it('throws on invalid frontmatter lines', () => {
    expect(() =>
      parseChangelogMarkdown(
        ['---', 'title: A title', 'lead A lead', '---'].join('\n')
      )
    ).toThrow(/Invalid changelog frontmatter line/);
  });

  it.each(['title', 'lead'])('throws when %s is missing', key => {
    const lines =
      key === 'title' ?
        ['---', 'lead: A lead', '---']
      : ['---', 'title: A title', '---'];

    expect(() => parseChangelogMarkdown(lines.join('\n'))).toThrow(
      new RegExp(`missing a non-empty "${key}"`)
    );
  });

  it('throws when actionRequired is not a boolean', () => {
    expect(() =>
      parseChangelogMarkdown(
        [
          '---',
          'title: A title',
          'lead: A lead',
          'actionRequired: yes',
          '---',
        ].join('\n')
      )
    ).toThrow(/has to be "true" or "false"/);
  });
});

describe('inlineChangelogImages', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'changelog-images-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('inlines local images as data uris', () => {
    const content = Buffer.from('fake-png');
    writeFileSync(path.join(directory, 'screenshot.png'), content);

    const result = inlineChangelogImages(
      'Look: ![A screenshot](./screenshot.png)',
      directory
    );

    expect(result).toBe(
      `Look: ![A screenshot](data:image/png;base64,${content.toString('base64')})`
    );
  });

  it('inlines images from subfolders and url-encoded paths', () => {
    mkdirSync(path.join(directory, 'assets'));
    writeFileSync(path.join(directory, 'assets', 'my image.jpg'), 'x');

    const result = inlineChangelogImages(
      '![](assets/my%20image.jpg)',
      directory
    );

    expect(result).toContain('data:image/jpeg;base64,');
  });

  it('leaves remote and data images untouched', () => {
    const markdown =
      '![a](https://wepublish.ch/a.png) ![b](data:image/png;base64,abc)';

    expect(inlineChangelogImages(markdown, directory)).toBe(markdown);
  });

  it('throws when the image does not exist', () => {
    expect(() =>
      inlineChangelogImages('![missing](./missing.png)', directory)
    ).toThrow(/does not exist/);
  });

  it('throws on unsupported image types', () => {
    writeFileSync(path.join(directory, 'video.mp4'), 'x');

    expect(() =>
      inlineChangelogImages('![video](./video.mp4)', directory)
    ).toThrow(/unsupported type/);
  });

  it('throws when the image points outside of the changelog folder', () => {
    expect(() =>
      inlineChangelogImages('![escape](../secret.png)', directory)
    ).toThrow(/outside of the changelog folder/);
  });
});
