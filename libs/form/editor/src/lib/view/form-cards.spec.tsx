import { screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import {
  formSectionOf,
  getFieldByLabel,
  queryFieldByLabel,
  renderEditorForm,
  renderFormRoutes,
} from '../../testing';
import { FormDrawer, FormDrawerPanel } from './form-drawer';
import { FormPage } from './form-page';
import { formView } from './form-view';
import { useCreateForm } from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  slug: z.string().meta({ label: 'demo.slug' }),
  newsletter: z.boolean().meta({ label: 'demo.newsletter' }),
  tracking: z.boolean().meta({ label: 'demo.tracking' }),
  notes: z.string().meta({ label: 'demo.notes' }),
  code: z.string().min(1).meta({ label: 'demo.code' }),
});

const paths = { list: '/demo', edit: (id: string) => `/demo/edit/${id}` };

const cardsView = formView(schema, {
  layout: 'cards',
  paths,
  sections: [
    {
      title: 'demo.details',
      description: 'demo.detailsInfo',
      fields: ['name', 'slug'],
    },
    { title: 'demo.choices', fields: [{ group: ['newsletter', 'tracking'] }] },
    { title: 'demo.notes', span: 'full', fields: ['notes'] },
    { title: 'demo.code', collapsible: 'closed', fields: ['code'] },
  ],
});

const sectionsView = formView(schema, {
  paths,
  sections: [
    { title: 'demo.details', fields: ['name', 'slug'] },
    { title: 'demo.choices', fields: [{ group: ['newsletter', 'tracking'] }] },
    { title: 'demo.notes', fields: ['notes'] },
    { title: 'demo.code', collapsible: 'closed', fields: ['code'] },
  ],
});

function CardsPage() {
  const demo = useCreateForm(cardsView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

function SectionsPage() {
  const demo = useCreateForm(sectionsView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

function CardsDrawerForm() {
  const demo = useCreateForm(cardsView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormDrawerPanel controller={demo} />;
}

function CardsDrawer() {
  return (
    <FormDrawer
      open
      onClose={() => undefined}
    >
      <CardsDrawerForm />
    </FormDrawer>
  );
}

const region = (title: string) => screen.getByRole('region', { name: title });

const titles = ['demo.details', 'demo.choices', 'demo.notes', 'demo.code'];

const follows = (first: HTMLElement, second: HTMLElement) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );

describe('the cards layout', () => {
  it('renders every titled section as a card region with an h4-styled heading', () => {
    renderEditorForm(<CardsPage />);

    const details = region('demo.details');
    const heading = within(details).getByRole('heading', {
      level: 2,
      name: 'demo.details',
    });

    expect(details).toHaveClass('MuiCard-root');
    expect(details).toHaveClass('MuiPaper-outlined');
    expect(heading).toHaveClass('MuiTypography-h4');
    expect(
      formSectionOf('demo.details').getByText('demo.detailsInfo')
    ).toBeInTheDocument();
    expect(
      formSectionOf('demo.details').getByLabelText('demo.name*', {
        selector: 'input',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('demo.choices').getByRole('checkbox', {
        name: 'demo.tracking',
      })
    ).toBeInTheDocument();
  });

  it('puts the cards in a two-column grid in declaration order', () => {
    renderEditorForm(<CardsPage />);

    const cards = titles.map(region);
    const grid = cards[0].parentElement as HTMLElement;

    expect(cards.every(card => card.parentElement === grid)).toBe(true);
    expect(
      cards.slice(1).every((next, index) => follows(cards[index], next))
    ).toBe(true);
    expect(getComputedStyle(grid).display).toBe('grid');
    expect(getComputedStyle(grid).gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('lets a card span the whole row', () => {
    renderEditorForm(<CardsPage />);

    expect(getComputedStyle(region('demo.notes')).gridColumn).toMatch(
      /^1\s*\/\s*-1$/
    );
    expect(getComputedStyle(region('demo.details')).gridColumn).toBe('');
  });

  it('widens the body for the grid', () => {
    renderEditorForm(<CardsPage />);

    const grid = region('demo.details').parentElement as HTMLElement;

    expect(getComputedStyle(grid.parentElement as HTMLElement).maxWidth).toBe(
      '1200px'
    );
  });

  it('collapses a collapsible card behind the button in its title', async () => {
    const { user } = renderEditorForm(<CardsPage />);
    const toggle = formSectionOf('demo.code').getByRole('button', {
      name: 'demo.code',
    });

    expect(region('demo.code')).toHaveClass('MuiCard-root');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(queryFieldByLabel('demo.code*')).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      formSectionOf('demo.code').getByLabelText('demo.code*', {
        selector: 'input',
      })
    ).toBeInTheDocument();
  });

  it('opens a collapsed card that holds errors and counts them', async () => {
    const { user } = renderEditorForm(<CardsPage />);

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.code*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(screen.getByRole('button', { name: /^demo\.code/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(
      formSectionOf(/^demo\.code/).getByText('form.view.sectionErrors')
    ).toBeInTheDocument();
  });

  it('stacks the cards in one column in a drawer and titles them h3', () => {
    renderFormRoutes({ '/demo': <CardsDrawer /> }, { route: '/demo' });

    const dialog = within(screen.getByRole('dialog'));
    const details = dialog.getByRole('region', { name: 'demo.details' });
    const grid = details.parentElement as HTMLElement;

    expect(details).toHaveClass('MuiCard-root');
    expect(
      within(details).getByRole('heading', { level: 3, name: 'demo.details' })
    ).toHaveClass('MuiTypography-h4');
    expect(getComputedStyle(grid).gridTemplateColumns).toBe('repeat(1, 1fr)');
  });

  it('keeps the default layout free of cards', () => {
    const { baseElement } = renderEditorForm(<SectionsPage />);

    const details = region('demo.details');

    expect(baseElement.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(
      within(details).getByRole('heading', { level: 2, name: 'demo.details' })
    ).toHaveClass('MuiTypography-subtitle1');
    expect(
      getComputedStyle(details.parentElement as HTMLElement).display
    ).not.toBe('grid');
    expect(
      getComputedStyle(
        details.parentElement?.parentElement?.parentElement as HTMLElement
      ).maxWidth
    ).toBe('760px');
  });
});
