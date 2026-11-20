import {
  CanCreateArticle,
  CanGetArticle,
  CanGetUsers,
  CanLoginEditor,
} from './permissions';
import { grantsOnlyReaderAccess } from './reader-access';

describe('grantsOnlyReaderAccess', () => {
  it('holds for an account without any permission', () => {
    expect(grantsOnlyReaderAccess([])).toBe(true);
  });

  it('holds for a role that only lets its readers past the paywall', () => {
    expect(grantsOnlyReaderAccess([CanGetArticle.id])).toBe(true);
  });

  it.each([
    ['editor login', [CanLoginEditor.id]],
    ['access to user data', [CanGetUsers.id]],
    ['paywall plus article editing', [CanGetArticle.id, CanCreateArticle.id]],
  ])('does not hold for %s', (_name, permissionIDs) => {
    expect(grantsOnlyReaderAccess(permissionIDs)).toBe(false);
  });
});
