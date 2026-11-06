import { screen } from '@testing-library/react';
import { Link, useNavigate } from 'react-router-dom';

import { renderEditorForm } from '../../testing';
import { useRouteDrawer } from './use-route-drawer';

const paths = {
  list: '/demo',
  create: '/demo/create',
  edit: '/demo/edit/:id',
} as const;

function Probe() {
  const drawer = useRouteDrawer(paths);
  const navigate = useNavigate();

  return (
    <>
      <output data-testid="drawer">
        {JSON.stringify({
          open: drawer.open,
          mode: drawer.mode ?? null,
          id: drawer.id ?? null,
        })}
      </output>
      <button
        type="button"
        onClick={drawer.close}
      >
        close
      </button>
      <button
        type="button"
        onClick={() => navigate(-1)}
      >
        back
      </button>
      <Link to="/demo/create">create</Link>
      <Link to="/demo/edit/1">edit 1</Link>
      <Link to="/demo/edit/2">edit 2</Link>
    </>
  );
}

const drawer = () =>
  JSON.parse(screen.getByTestId('drawer').textContent ?? '{}');

describe('useRouteDrawer', () => {
  it('is closed on the list', () => {
    renderEditorForm(<Probe />, { route: '/demo' });

    expect(drawer()).toEqual({ open: false, mode: null, id: null });
  });

  it('opens for creating and for editing from the route', async () => {
    const { user } = renderEditorForm(<Probe />, { route: '/demo/create' });

    expect(drawer()).toEqual({ open: true, mode: 'create', id: null });

    await user.click(screen.getByRole('link', { name: 'edit 2' }));

    expect(drawer()).toEqual({ open: true, mode: 'edit', id: '2' });
  });

  it('keeps the last content while it closes and opens again afterwards', async () => {
    const { user } = renderEditorForm(<Probe />, { route: '/demo/edit/1' });

    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(drawer()).toEqual({ open: false, mode: 'edit', id: '1' });

    await user.click(screen.getByRole('link', { name: 'create' }));

    expect(drawer()).toEqual({ open: true, mode: 'create', id: null });
  });

  it('keeps the record it last showed when it closes from a second record', async () => {
    const { user } = renderEditorForm(<Probe />, { route: '/demo/edit/1' });

    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(screen.getByRole('link', { name: 'edit 2' }));

    expect(drawer()).toEqual({ open: true, mode: 'edit', id: '2' });

    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(drawer()).toEqual({ open: false, mode: 'edit', id: '2' });
  });

  it('closes on browser back', async () => {
    const { user } = renderEditorForm(<Probe />, { route: '/demo' });

    await user.click(screen.getByRole('link', { name: 'edit 1' }));

    expect(drawer()).toMatchObject({ open: true, id: '1' });

    await user.click(screen.getByRole('button', { name: 'back' }));

    expect(drawer()).toEqual({ open: false, mode: 'edit', id: '1' });
  });
});
