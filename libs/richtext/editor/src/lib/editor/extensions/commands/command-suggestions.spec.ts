import i18next from 'i18next';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createCommandSuggestions } from './command-suggestions';
import { CommandItem } from '../commands';

/**
 * The built-in titles are translated, so the suggestions are only meaningful
 * once i18next can resolve the three keys.
 */
beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          richtext: {
            commands: {
              table: 'Table',
              quote: 'Quote',
              code: 'Code',
            },
          },
        },
      },
    },
  });
});

const titles = (
  suggestions: ReturnType<typeof createCommandSuggestions>,
  query = ''
) => suggestions.items({ query, editor: {} as never }).map(item => item.title);

const item = (title: string): CommandItem => ({
  title,
  command: vi.fn(),
});

describe('createCommandSuggestions', () => {
  it('offers the three built-in commands when nothing is contributed', () => {
    expect(titles(createCommandSuggestions())).toEqual([
      'Table',
      'Quote',
      'Code',
    ]);
  });

  it('appends contributed items after the built-in ones', () => {
    const suggestions = createCommandSuggestions([item('Fakt')]);

    expect(titles(suggestions)).toEqual(['Table', 'Quote', 'Code', 'Fakt']);
  });

  it('filters contributed items by the query, case-insensitively', () => {
    const suggestions = createCommandSuggestions([
      item('Fakt'),
      item('Fussnote'),
    ]);

    expect(titles(suggestions, 'fak')).toEqual(['Fakt']);
    expect(titles(suggestions, 'FU')).toEqual(['Fussnote']);
    expect(titles(suggestions, 'ta')).toEqual(['Table']);
  });

  it('never lets a contributed item remove or shadow a built-in command', () => {
    // An integration that contributes a command of the same name must not be
    // able to take away a command a writer relies on: the built-in stays, and
    // it stays first.
    const eigenes = vi.fn();
    const suggestions = createCommandSuggestions([
      { title: 'Table', command: eigenes },
    ]);
    const treffer = suggestions.items({
      query: 'table',
      editor: {} as never,
    });

    expect(treffer).toHaveLength(2);
    expect(treffer[0].title).toBe('Table');
    // Der erste Treffer ist der eingebaute Befehl und nicht der beigesteuerte.
    expect(treffer[0].command).not.toBe(eigenes);
    expect(treffer[1].command).toBe(eigenes);
  });

  it('keeps the limit of ten across built-in and contributed items', () => {
    const viele = Array.from({ length: 20 }, (_, i) => item(`Fakt ${i}`));

    expect(titles(createCommandSuggestions(viele))).toHaveLength(10);
  });

  it('runs the command of a contributed item', () => {
    const befehl = vi.fn();
    const suggestions = createCommandSuggestions([
      { title: 'Fakt', command: befehl },
    ]);
    const [treffer] = suggestions.items({
      query: 'Fakt',
      editor: {} as never,
    });
    const range = { from: 1, to: 5 };

    treffer.command({ editor: {} as never, range });

    expect(befehl).toHaveBeenCalledWith({ editor: {}, range });
  });

  it('asks a provider function for the contributed items on every request', () => {
    const contributed: CommandItem[] = [];
    const suggestions = createCommandSuggestions(() => contributed);

    expect(titles(suggestions)).toEqual(['Table', 'Quote', 'Code']);

    contributed.push(item('Fakt'));

    expect(titles(suggestions)).toEqual(['Table', 'Quote', 'Code', 'Fakt']);
  });
});
