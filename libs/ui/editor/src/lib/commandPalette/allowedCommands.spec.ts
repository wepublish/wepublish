import type { Command } from './command';
import { allowedCommands } from './allowedCommands';

type TestCommand = Omit<Partial<Command>, 'feature'> & {
  id: string;
  feature?: string;
};

const command = (partial: TestCommand): Command =>
  ({
    group: 'navigate',
    title: partial.id,
    icon: null,
    perform: () => undefined,
    ...partial,
  }) as Command;

describe('allowedCommands', () => {
  const granted = new Set(['CAN_GET_ARTICLES']);
  const features = new Set(['peering']);

  it('keeps commands that ask for nothing', () => {
    const commands = [command({ id: 'dashboard' })];

    expect(allowedCommands(commands, granted, features)).toEqual(commands);
  });

  it('keeps a command when any one of its permissions is granted', () => {
    const commands = [
      command({
        id: 'articles',
        permissions: ['CAN_CREATE_ARTICLE', 'CAN_GET_ARTICLES'],
      }),
    ];

    expect(allowedCommands(commands, granted, features)).toEqual(commands);
  });

  it('drops a command when none of its permissions is granted', () => {
    const commands = [command({ id: 'users', permissions: ['CAN_GET_USERS'] })];

    expect(allowedCommands(commands, granted, features)).toEqual([]);
  });

  it('drops a command whose feature is off for this medium', () => {
    const commands = [command({ id: 'crowdfunding', feature: 'crowdfunding' })];

    expect(allowedCommands(commands, granted, features)).toEqual([]);
  });

  it('keeps a command whose feature is on', () => {
    const commands = [command({ id: 'peering', feature: 'peering' })];

    expect(allowedCommands(commands, granted, features)).toEqual(commands);
  });

  it('shows everything while the session roles are still unknown, as the sidebar does', () => {
    const commands = [command({ id: 'users', permissions: ['CAN_GET_USERS'] })];

    expect(allowedCommands(commands, undefined, features)).toEqual(commands);
  });

  it('still hides unknown features while they are loading, as the sidebar does', () => {
    const commands = [command({ id: 'peering', feature: 'peering' })];

    expect(allowedCommands(commands, granted, undefined)).toEqual([]);
  });
});
