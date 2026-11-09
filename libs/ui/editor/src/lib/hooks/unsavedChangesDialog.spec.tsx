import { act, render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  useNavigate,
} from 'react-router-dom';

import { useUnsavedChangesDialog } from './unsavedChangesDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

function Editor({ hasChanges }: { hasChanges: boolean }) {
  useUnsavedChangesDialog(hasChanges);
  const navigate = useNavigate();

  return (
    <>
      <p>editor</p>
      <button onClick={() => navigate('/list')}>leave</button>
      <button onClick={() => navigate('/edit/1', { replace: true })}>
        redirect
      </button>
    </>
  );
}

const renderEditor = (hasChanges: boolean) => {
  const router = createMemoryRouter(
    [
      { path: '/edit', element: <Editor hasChanges={hasChanges} /> },
      { path: '/edit/:id', element: <p>edited</p> },
      { path: '/list', element: <p>list</p> },
    ],
    { initialEntries: ['/list', '/edit'], initialIndex: 1 }
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe('useUnsavedChangesDialog', () => {
  const confirm = vi.fn<(message?: string) => boolean>();

  beforeEach(() => {
    vi.stubGlobal('confirm', confirm);
  });

  afterEach(() => {
    confirm.mockReset();
    vi.unstubAllGlobals();
  });

  it('lets navigation through without asking when nothing changed', async () => {
    const router = renderEditor(false);

    await act(() => screen.getByText('leave').click());

    expect(confirm).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/list');
  });

  it('stays on the page when the user cancels the prompt', async () => {
    confirm.mockReturnValue(false);
    const router = renderEditor(true);

    await act(() => screen.getByText('leave').click());

    expect(confirm).toHaveBeenCalledWith('unsavedChangesDialog.message');
    expect(router.state.location.pathname).toBe('/edit');
    expect(screen.getByText('editor')).toBeTruthy();
  });

  it('navigates when the user confirms the prompt', async () => {
    confirm.mockReturnValue(true);
    const router = renderEditor(true);

    await act(() => screen.getByText('leave').click());

    expect(router.state.location.pathname).toBe('/list');
  });

  it('blocks history navigation too', async () => {
    confirm.mockReturnValue(false);
    const router = renderEditor(true);

    await act(() => router.navigate(-1));

    expect(confirm).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/edit');
  });

  it('does not ask on a replace, like the redirect after creating', async () => {
    const router = renderEditor(true);

    await act(() => screen.getByText('redirect').click());

    expect(confirm).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/edit/1');
  });

  it('still warns before the tab is closed', () => {
    renderEditor(true);
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
