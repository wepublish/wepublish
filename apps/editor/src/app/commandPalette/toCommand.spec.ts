import type { CommandContext } from '@wepublish/ui/editor';
import type { i18n as I18n, TFunction } from 'i18next';

import { toCommand } from './toCommand';

const t = ((key: string) => key) as TFunction;
const i18n = { getFixedT: () => (key: string) => key } as unknown as I18n;

const context = (): CommandContext => ({
  navigate: vi.fn(),
  close: vi.fn(),
});

describe('toCommand', () => {
  it('runs the perform the command brought with it', () => {
    const openSomething = vi.fn();
    const command = toCommand(
      'account',
      t,
      i18n
    )({
      id: 'logout',
      titleKey: 'navbar.logout',
      icon: null,
      perform: openSomething,
    });
    const ctx = context();

    command.perform(ctx);

    expect(openSomething).toHaveBeenCalledWith(ctx);
    expect(ctx.navigate).not.toHaveBeenCalled();
  });

  it('hands perform the context, so a command can close the palette', () => {
    const perform = vi.fn();
    const ctx = context();

    toCommand(
      'account',
      t,
      i18n
    )({
      id: 'theme',
      titleKey: 'navbar.colorMode.title',
      icon: null,
      perform,
    }).perform(ctx);

    expect(perform.mock.calls[0][0].close).toBe(ctx.close);
  });

  it('searches a command by its title in every interface language', () => {
    const command = toCommand(
      'account',
      t,
      i18n
    )({
      id: 'logout',
      titleKey: 'navbar.logout',
      icon: null,
      perform: () => undefined,
    });

    expect(command.keywords).toEqual(['navbar.logout']);
  });

  it('keeps the feature a command depends on, so the palette can hide it', () => {
    const command = toCommand(
      'navigate',
      t,
      i18n
    )({
      id: 'letterLayouts',
      titleKey: 'navbar.letterLayouts',
      icon: null,
      feature: 'paper-letters',
      perform: () => undefined,
    });

    expect(command.feature).toBe('paper-letters');
  });
});
