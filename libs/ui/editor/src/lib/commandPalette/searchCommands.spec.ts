import type { Command } from './command';
import { searchCommands } from './searchCommands';

const command = (partial: Partial<Command> & { id: string }): Command => ({
  group: 'navigate',
  title: partial.id,
  icon: null,
  perform: () => undefined,
  ...partial,
});

const titles = (matches: { command: Command }[]) =>
  matches.map(({ command }) => command.title);

describe('searchCommands', () => {
  it('keeps every command, in registry order, for an empty query', () => {
    const commands = [
      command({ id: 'b', title: 'Pages' }),
      command({ id: 'a', title: 'Articles' }),
    ];

    expect(titles(searchCommands(commands, ''))).toEqual(['Pages', 'Articles']);
  });

  it('ignores surrounding whitespace', () => {
    const commands = [command({ id: 'a', title: 'Articles' })];

    expect(titles(searchCommands(commands, '  art  '))).toEqual(['Articles']);
  });

  it('drops commands that match neither title nor keywords', () => {
    const commands = [
      command({ id: 'a', title: 'Articles' }),
      command({ id: 'p', title: 'Pages' }),
    ];

    expect(titles(searchCommands(commands, 'art'))).toEqual(['Articles']);
  });

  it('matches keywords as well as the title', () => {
    const commands = [
      command({ id: 'i', title: 'Images', keywords: ['bilder', 'media'] }),
    ];

    expect(titles(searchCommands(commands, 'bilder'))).toEqual(['Images']);
  });

  it('highlights the title but not a keyword-only hit', () => {
    const commands = [
      command({ id: 'i', title: 'Images', keywords: ['bilder'] }),
    ];

    expect(searchCommands(commands, 'ima')[0].indices).toEqual([0, 1, 2]);
    expect(searchCommands(commands, 'bild')[0].indices).toEqual([]);
  });

  it('ranks a title hit above a keyword hit', () => {
    const commands = [
      command({ id: 'k', title: 'Documents', keywords: ['tag'] }),
      command({ id: 't', title: 'Tags' }),
    ];

    expect(titles(searchCommands(commands, 'tag'))).toEqual([
      'Tags',
      'Documents',
    ]);
  });

  it('matches across the title and its section, so "article tag" works', () => {
    const commands = [
      command({ id: 'at', title: 'Tags', section: 'Articles' }),
      command({ id: 'et', title: 'Tags', section: 'Events' }),
    ];

    expect(titles(searchCommands(commands, 'article tag'))).toEqual(['Tags']);
  });

  it('does not highlight section characters in the title', () => {
    const commands = [
      command({ id: 'at', title: 'Tags', section: 'Articles' }),
    ];

    expect(searchCommands(commands, 'article tag')[0].indices).toEqual([]);
  });

  it('keeps the better of the title and section score', () => {
    const commands = [
      command({ id: 'a', title: 'Articles', section: 'Content' }),
      command({ id: 't', title: 'Tags', section: 'Articles' }),
    ];

    expect(titles(searchCommands(commands, 'articles'))[0]).toBe('Articles');
  });
});
