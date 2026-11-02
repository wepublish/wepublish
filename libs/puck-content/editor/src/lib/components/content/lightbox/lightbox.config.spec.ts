import { PuckContext, registerOverlayPortal } from '@puckeditor/core';
import { render } from '@testing-library/react';
import { LightboxRender } from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { LightboxConfig } from './lightbox.config';

vi.mock('@wepublish/puck-content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/puck-content/website')>()),
  LightboxRender: vi.fn(() => null),
}));

const puck = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const renderLightbox = (isEditing: boolean) =>
  render(
    createElement(LightboxConfig.render, {
      id: 'Lightbox-1',
      puck: puck(isEditing),
      images: [{ imageId: 'harbour', caption: 'Harbour' }],
    } as Parameters<typeof LightboxConfig.render>[0])
  );

const lastLightboxProps = () =>
  vi.mocked(LightboxRender).mock.calls.at(-1)?.[0];

describe('LightboxConfig', () => {
  it('renders the website lightbox with the stored images', () => {
    renderLightbox(true);

    expect(lastLightboxProps()).toMatchObject({
      id: 'Lightbox-1',
      props: { images: [{ imageId: 'harbour', caption: 'Harbour' }] },
    });
  });

  it('lets editors use the gallery buttons through the overlay', () => {
    renderLightbox(true);

    expect(lastLightboxProps()?.refs).toEqual({
      fullscreen: registerOverlayPortal,
      prev: registerOverlayPortal,
      next: registerOverlayPortal,
    });
  });

  it('passes no overlay refs outside the editor', () => {
    renderLightbox(false);

    expect(lastLightboxProps()).not.toHaveProperty('refs');
  });

  it('can hide the captions and take a ratio and fit per breakpoint', () => {
    expect(LightboxConfig.fields?.hideCaption).toMatchObject({
      type: 'switch',
      label: 'Hide captions',
      ai: { instructions: expect.any(String) },
    });
    expect(LightboxConfig.fields?.fit).toMatchObject({
      type: 'breakpoints',
      objectFields: {
        aspectRatio: { type: 'aspectRatio' },
        objectFit: { type: 'objectFit' },
      },
    });
    expect(LightboxConfig.defaultProps).toMatchObject({
      hideCaption: false,
      fit: { xs: { aspectRatio: 'auto', objectFit: 'cover' } },
    });
    expect(LightboxConfig.ai?.instructions).toContain('hideCaption');
    expect(LightboxConfig.ai?.instructions).toContain('fit');
  });
});
