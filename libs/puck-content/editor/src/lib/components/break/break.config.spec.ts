import { PuckContext } from '@puckeditor/core';
import { render } from '@testing-library/react';
import { BreakRender } from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { placeholderRichText } from '../placeholder-richtext';
import { BreakConfig } from './break.config';

vi.mock('@wepublish/puck-content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/puck-content/website')>()),
  BreakRender: vi.fn(() => null),
}));

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const renderBreak = (isEditing: boolean) =>
  render(
    createElement(BreakConfig.render, {
      ...BreakConfig.defaultProps,
      id: 'Break-1',
      puck: puck(isEditing),
    } as Parameters<typeof BreakConfig.render>[0])
  );

const lastBreakProps = () => vi.mocked(BreakRender).mock.calls.at(-1)?.[0];

describe('BreakConfig', () => {
  it('uses fixed placeholder defaults', () => {
    expect(BreakConfig.defaultProps).toEqual({
      text: 'Hello, world',
      hideButton: false,
      linkText: 'Learn more',
      linkURL: '/',
      linkTarget: '_self',
      richText: placeholderRichText(),
      datasources: { image: { type: 'single', id: '' } },
    });
  });

  it('renders the website break with the stored props', () => {
    renderBreak(true);

    expect(lastBreakProps()).toMatchObject({
      id: 'Break-1',
      props: {
        text: 'Hello, world',
        hideButton: false,
        linkText: 'Learn more',
        linkURL: '/',
        linkTarget: '_self',
        richText: placeholderRichText(),
      },
    });
    expect(lastBreakProps()?.props).not.toHaveProperty('datasources');
  });

  it('lets editors reach the button through the overlay', () => {
    renderBreak(true);

    expect(lastBreakProps()).toMatchObject({
      refs: { button: expect.any(Function) },
    });
  });

  it('passes no overlay refs outside the editor', () => {
    renderBreak(false);

    expect(lastBreakProps()).not.toHaveProperty('refs');
  });
});

describe('placeholderRichText', () => {
  it('returns the same placeholder paragraph every time', () => {
    expect(placeholderRichText()).toEqual(placeholderRichText());
  });
});
