import { screen, within } from '@testing-library/react';
import {
  mockImage,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { createElement } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../../blocks/block.types';
import { ListicleConfigProps, ListicleRender } from './listicle.component';

vi.mock('@puckeditor/core', () => {
  throw new Error('website must not load Puck');
});

const lake = mockImage({ id: 'lake', description: 'A quiet lake' });
const summit = mockImage({ id: 'summit', description: 'The summit' });

const props: ListicleConfigProps = {
  items: [
    {
      title: 'Hike to the summit',
      richText: mockRichTextParagraph('Start early.'),
      imageId: 'summit',
    },
    {
      title: 'Swim in the lake',
      richText: mockRichTextParagraph('Bring a towel.'),
      imageId: 'lake',
    },
    {
      title: 'Rest at the hut',
      richText: mockRichTextParagraph('Order soup.'),
    },
  ],
};

const renderListicle = (data: PuckBlockData = emptyPuckBlockData) =>
  renderWithProviders(
    createElement(ListicleRender, {
      id: 'Listicle-1',
      props,
      data,
      slots: {},
      className: 'styled-block',
    })
  );

const item = (title: string) =>
  screen.getByRole('heading', { name: title }).parentElement as HTMLElement;

describe('ListicleRender', () => {
  it('shows every stored item in order', () => {
    renderListicle();

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Hike to the summit', 'Swim in the lake', 'Rest at the hut']);
    expect(screen.getByText('Bring a towel.')).toBeInTheDocument();
  });

  it('shows the image of every item from data by its id', () => {
    renderListicle({ ...emptyPuckBlockData, images: [lake, summit] });

    expect(
      within(item('Hike to the summit')).getByRole('img', {
        name: 'The summit',
      })
    ).toBeInTheDocument();
    expect(
      within(item('Swim in the lake')).getByRole('img', {
        name: 'A quiet lake',
      })
    ).toBeInTheDocument();
    expect(
      within(item('Rest at the hut')).queryByRole('img')
    ).not.toBeInTheDocument();
  });

  it('shows no images until the data holds them', () => {
    renderListicle();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('puts the class name on its single root element', () => {
    const { container } = renderListicle();

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass('styled-block');
  });
});
