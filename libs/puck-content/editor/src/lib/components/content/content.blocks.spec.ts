import { createTheme, ThemeProvider } from '@mui/material';
import { PuckContext } from '@puckeditor/core';
import { render } from '@testing-library/react';
import * as website from '@wepublish/puck-content/website';
import { mockImage } from '@wepublish/mocks/website';
import { ComponentType, createElement } from 'react';

import { PuckBlockDataContext } from '../../block-data/puck-block-data.context';
import { PuckConfig } from '../../config.types';
import { contentDatasourceFieldTabs } from '../../field-tabs/field-tabs';
import {
  contentComponents,
  contentDerivedDatasources,
  contentFieldTabs,
} from './content.blocks';

const { websiteRenders } = vi.hoisted(() => ({
  websiteRenders: {
    Title: 'TitleRender',
    Quote: 'QuoteRender',
    Html: 'HtmlRender',
    Break: 'BreakRender',
    RichText: 'RichTextRender',
    Listicle: 'ListicleRender',
    IFrame: 'IFrameRender',
    YouTube: 'YouTubeRender',
    Vimeo: 'VimeoRender',
    TikTok: 'TikTokRender',
    FacebookVideo: 'FacebookVideoRender',
    Facebook: 'FacebookRender',
    Instagram: 'InstagramRender',
    Button: 'ButtonRender',
    Image: 'ImageRender',
    Lightbox: 'LightboxRender',
    Twitter: 'TwitterRender',
    SoundCloud: 'SoundCloudRender',
    Streamable: 'StreamableRender',
    Polis: 'PolisRender',
    BildwurfAd: 'BildwurfAdRender',
  } as const,
}));

vi.mock('@wepublish/puck-content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/puck-content/website')>()),
  ...Object.fromEntries(
    Object.values(websiteRenders).map(name => [name, vi.fn(() => null)])
  ),
}));

type ContentType = keyof typeof websiteRenders;
type WebsiteRender = (typeof websiteRenders)[ContentType];

type PuckRenderProps = Record<string, unknown> & {
  id: string;
  puck: PuckContext;
};

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
};

describe('contentComponents', () => {
  it('has a config for every website content block', () => {
    expect(Object.keys(contentComponents).sort()).toEqual(
      Object.keys(website.contentBlockRegistry).sort()
    );
  });

  it.each(Object.entries(websiteRenders) as [ContentType, WebsiteRender][])(
    '%s renders %s with the data of the preview',
    (type, renderName) => {
      const config = contentComponents[type];
      const data = {
        ...website.emptyPuckBlockData,
        images: [mockImage({ id: 'harbour' })],
      };

      render(
        createElement(
          ThemeProvider,
          { theme: createTheme() },
          createElement(
            PuckBlockDataContext.Provider,
            { value: new Map([['Block-1', data]]) },
            createElement(config.render as ComponentType<PuckRenderProps>, {
              ...config.defaultProps,
              id: 'Block-1',
              puck,
            })
          )
        )
      );

      expect(
        vi.mocked(website[renderName]).mock.calls.at(-1)?.[0]
      ).toMatchObject({ id: 'Block-1', data });
    }
  );

  it('fits the Puck config of every document kind', () => {
    expectTypeOf(contentComponents).toExtend<
      Pick<PuckConfig['components'], ContentType>
    >();
  });

  it('shows the image datasource in the content tab', () => {
    expect(contentFieldTabs).toEqual({
      Image: contentDatasourceFieldTabs,
      Quote: contentDatasourceFieldTabs,
      Break: contentDatasourceFieldTabs,
    });
  });
});

describe('contentDerivedDatasources', () => {
  it('derives the images of galleries and listicles only', () => {
    expect(Object.keys(contentDerivedDatasources).sort()).toEqual([
      'Lightbox',
      'Listicle',
    ]);
  });

  it('picks the images of a lightbox in order, once each', () => {
    expect(
      contentDerivedDatasources.Lightbox?.({
        images: [
          { imageId: 'summit', caption: 'Summit' },
          { caption: 'Not picked yet' },
          { imageId: '' },
          { imageId: 'lake' },
          { imageId: 'summit' },
        ],
      })
    ).toEqual({ image: { type: 'multiple', ids: ['summit', 'lake'] } });
  });

  it('picks the images of the listicle items in order', () => {
    expect(
      contentDerivedDatasources.Listicle?.({
        items: [
          { title: 'First', imageId: 'lake' },
          { title: 'Second' },
          { title: 'Third', imageId: 'summit' },
        ],
      })
    ).toEqual({ image: { type: 'multiple', ids: ['lake', 'summit'] } });
  });

  it('picks no images while none are set', () => {
    expect(contentDerivedDatasources.Lightbox?.({})).toEqual({
      image: { type: 'multiple', ids: [] },
    });
    expect(
      contentDerivedDatasources.Listicle?.({ items: 'not a list' })
    ).toEqual({ image: { type: 'multiple', ids: [] } });
  });
});
