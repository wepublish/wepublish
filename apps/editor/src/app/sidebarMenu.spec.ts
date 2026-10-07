import { onlyLatestOpen } from './sidebarMenu';

describe('onlyLatestOpen', () => {
  it('closes the open menu when another one is opened', () => {
    expect(onlyLatestOpen(['articles'], ['articles', 'pages'])).toEqual([
      'pages',
    ]);
  });

  it('closes the menu the user collapsed', () => {
    expect(onlyLatestOpen(['articles'], [])).toEqual([]);
  });

  it('opens the first menu', () => {
    expect(onlyLatestOpen([], ['comments'])).toEqual(['comments']);
  });
});
