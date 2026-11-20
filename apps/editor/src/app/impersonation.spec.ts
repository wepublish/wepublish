import { LocalStorageKey } from '@wepublish/editor/api';

import {
  IMPERSONATOR_SESSION_KEY,
  endEditorImpersonation,
  startEditorImpersonation,
} from './impersonation';

describe('editor impersonation', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the supporter session aside and switches to the user', () => {
    localStorage.setItem(LocalStorageKey.SessionToken, 'supporter-token');
    const navigate = vi.fn();

    startEditorImpersonation('user-token', navigate);

    expect(localStorage.getItem(IMPERSONATOR_SESSION_KEY)).toBe(
      'supporter-token'
    );
    expect(localStorage.getItem(LocalStorageKey.SessionToken)).toBe(
      'user-token'
    );
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('goes back to the supporter session when it ends', () => {
    localStorage.setItem(IMPERSONATOR_SESSION_KEY, 'supporter-token');
    localStorage.setItem(LocalStorageKey.SessionToken, 'user-token');
    const navigate = vi.fn();

    endEditorImpersonation(navigate);

    expect(localStorage.getItem(LocalStorageKey.SessionToken)).toBe(
      'supporter-token'
    );
    expect(localStorage.getItem(IMPERSONATOR_SESSION_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/users');
  });

  it('logs out when there is no supporter session to go back to', () => {
    localStorage.setItem(LocalStorageKey.SessionToken, 'user-token');
    const navigate = vi.fn();

    endEditorImpersonation(navigate);

    expect(localStorage.getItem(LocalStorageKey.SessionToken)).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
