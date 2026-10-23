import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { emptyEventForm, EventFormValues } from '../event-form-schema';
import {
  formValues,
  mockElementRects,
  moveFirstRowDown,
  renderInForm,
} from '../test-helpers';
import { EventImagesField, eventImagesInput } from './event-images-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  ImageSelectPanel: ({
    onSelect,
  }: {
    onSelect: (image: Record<string, unknown>) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: 'img-3',
          title: 'Foyer',
          thumbURL: 'https://media.example.com/foyer.jpg',
          description: 'The foyer before the show',
        })
      }
    >
      pick foyer
    </button>
  ),
}));

const row = (
  id: string,
  overrides: Partial<EventFormValues['images'][number]['value']> = {}
) => ({
  id,
  value: {
    image: { id: `img-${id}`, title: `Image ${id}`, thumbURL: null },
    caption: '',
    altText: '',
    isMain: false,
    ...overrides,
  },
});

const twoImages = () => [
  row('1', { isMain: true, caption: '© Joana Magalhaes', altText: 'Dancers' }),
  row('2'),
];

const renderField = (images = twoImages()) =>
  renderInForm(<EventImagesField />, {
    defaultValues: {
      name: 'Qui-vive',
      tagIds: ['tag-1'],
      schedule: {
        ...emptyEventForm().schedule,
        continuous: {
          dateFrom: '2027-03-09',
          timeFrom: '20:00',
          dateTo: '2027-03-09',
          timeTo: '22:00',
          openingTime: '',
        },
      },
      images,
    },
  });

const mainOf = () =>
  formValues().images.map(({ value }) => [value.image.id, value.isMain]);

describe('EventImagesField', () => {
  it('marks exactly one image as main and moves the mark when another is chosen', () => {
    renderField();

    const radios = screen.getAllByRole('radio', {
      name: 'agenda.images.main',
    });

    expect(radios.map(radio => (radio as HTMLInputElement).checked)).toEqual([
      true,
      false,
    ]);

    fireEvent.click(radios[1]);

    expect(mainOf()).toEqual([
      ['img-1', false],
      ['img-2', true],
    ]);
  });

  it('keeps caption and alt text as separate labelled fields with distinct help', () => {
    renderField();

    const [caption] = screen.getAllByRole('textbox', {
      name: 'agenda.images.caption',
    });
    const [altText] = screen.getAllByRole('textbox', {
      name: 'agenda.images.altText',
    });

    expect(caption).toHaveValue('© Joana Magalhaes');
    expect(altText).toHaveValue('Dancers');
    expect(caption).toHaveAccessibleDescription(
      expect.stringContaining('agenda.images.captionHelp')
    );
    expect(altText).toHaveAccessibleDescription(
      expect.stringContaining('agenda.images.altTextHelp')
    );
  });

  it('counts caption characters against 125', () => {
    renderField();

    expect(screen.getByText('17/125')).toBeInTheDocument();
  });

  it('warns about an empty alt text without blocking the save', async () => {
    const onSubmit = renderField();

    expect(screen.getAllByText('agenda.images.altTextMissing')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('adds a picked image as a new row, main when it is the first, with its stored alt text', () => {
    renderField([]);

    fireEvent.click(screen.getByRole('button', { name: 'agenda.images.add' }));
    fireEvent.click(screen.getByRole('button', { name: 'pick foyer' }));

    expect(formValues().images.map(({ value }) => value)).toEqual([
      {
        image: {
          id: 'img-3',
          title: 'Foyer',
          thumbURL: 'https://media.example.com/foyer.jpg',
          description: 'The foyer before the show',
        },
        caption: '',
        altText: 'The foyer before the show',
        isMain: true,
      },
    ]);
  });

  it('makes the next image main when the main one is removed', () => {
    renderField();

    const [firstRow] = screen.getAllByRole('listitem');

    fireEvent.click(within(firstRow).getByRole('button', { name: 'delete' }));

    expect(mainOf()).toEqual([['img-2', true]]);
  });

  describe('reordering', () => {
    let rects: ReturnType<typeof mockElementRects>;

    beforeEach(() => {
      rects = mockElementRects();
    });

    afterEach(() => {
      rects.mockRestore();
    });

    it('changes the order the images are saved in', async () => {
      renderField();

      await moveFirstRowDown();

      expect(eventImagesInput(formValues().images)).toEqual([
        { imageId: 'img-2', caption: null, isMain: false },
        { imageId: 'img-1', caption: '© Joana Magalhaes', isMain: true },
      ]);
    });
  });
});
