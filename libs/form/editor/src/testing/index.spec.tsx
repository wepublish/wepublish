import { Drawer } from '@mui/material';
import { screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { Link, useBlocker } from 'react-router-dom';

import {
  drawerClosed,
  formSectionOf,
  renderEditorForm,
  renderFormRoutes,
} from './index';

function Panel() {
  const [open, setOpen] = useState(true);

  return (
    <Drawer
      open={open}
      anchor="right"
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
      >
        close
      </button>
    </Drawer>
  );
}

function Guarded() {
  const blocker = useBlocker(true);

  return (
    <>
      <p>{blocker.state}</p>
      <Link to="/elsewhere">leave</Link>
    </>
  );
}

describe('renderEditorForm', () => {
  it('mounts a data router, so navigation blockers work', async () => {
    const { user } = renderEditorForm(<Guarded />, { route: '/demo' });

    expect(screen.getByText('unblocked')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(screen.getByText('blocked')).toBeInTheDocument();
  });

  it('renders without transitions, so a closed drawer is gone right away', async () => {
    const { user, getByRole } = renderEditorForm(<Panel />);

    expect(document.querySelector('.MuiDrawer-root')).toBeInTheDocument();

    await user.click(getByRole('button', { name: 'close' }));

    await drawerClosed({ timeout: 50 });
  });
});

describe('renderFormRoutes', () => {
  it('renders the route that matches and reports the current path', async () => {
    const { user, currentPath } = renderFormRoutes(
      {
        '/demo/create': <Link to="/demo/edit/1">created</Link>,
        '/demo/edit/:id': <p>edit page</p>,
      },
      { route: '/demo/create' }
    );

    expect(currentPath()).toBe('/demo/create');

    await user.click(screen.getByRole('link', { name: 'created' }));

    expect(screen.getByText('edit page')).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/edit/1');
  });

  it('mounts a data router, so a blocker keeps the current path', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo': <Guarded /> },
      { route: '/demo' }
    );

    await user.click(screen.getByRole('link', { name: 'leave' }));

    expect(screen.getByText('blocked')).toBeInTheDocument();
    expect(currentPath()).toBe('/demo');
  });

  it('renders nothing on a path no route declares', () => {
    const { currentPath } = renderFormRoutes(
      { '/demo': <p>list</p> },
      { route: '/elsewhere' }
    );

    expect(screen.queryByText('list')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/elsewhere');
  });

  it('wraps the routes in the given wrapper', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return <div data-testid="wrapper">{children}</div>;
    }

    renderFormRoutes(
      { '/demo': <p>list</p> },
      { route: '/demo', wrapper: Wrapper }
    );

    expect(screen.getByTestId('wrapper')).toHaveTextContent('list');
  });
});

describe('formSectionOf', () => {
  it('queries inside the region named by a section title', () => {
    renderEditorForm(
      <>
        <section aria-labelledby="details-title">
          <h2 id="details-title">demo.details</h2>
          <p>inside</p>
        </section>
        <p>outside</p>
      </>
    );

    expect(
      formSectionOf('demo.details').getByText('inside')
    ).toBeInTheDocument();
    expect(formSectionOf('demo.details').queryByText('outside')).toBeNull();
  });
});
