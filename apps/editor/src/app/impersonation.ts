import { LocalStorageKey } from '@wepublish/editor/api';

export const IMPERSONATOR_SESSION_KEY = 'wepublish/impersonator-session';

const reload = (url: string) => window.location.assign(url);

export function startEditorImpersonation(
  token: string,
  navigate: (url: string) => void = reload
) {
  const supporter = localStorage.getItem(LocalStorageKey.SessionToken);

  if (supporter && !localStorage.getItem(IMPERSONATOR_SESSION_KEY)) {
    localStorage.setItem(IMPERSONATOR_SESSION_KEY, supporter);
  }

  localStorage.setItem(LocalStorageKey.SessionToken, token);
  navigate('/');
}

export function endEditorImpersonation(
  navigate: (url: string) => void = reload
) {
  const supporter = localStorage.getItem(IMPERSONATOR_SESSION_KEY);

  localStorage.removeItem(IMPERSONATOR_SESSION_KEY);

  if (supporter) {
    localStorage.setItem(LocalStorageKey.SessionToken, supporter);
    navigate('/users');
    return;
  }

  localStorage.removeItem(LocalStorageKey.SessionToken);
  navigate('/login');
}
