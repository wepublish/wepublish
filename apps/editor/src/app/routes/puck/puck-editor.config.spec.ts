import { Data } from '@puckeditor/core';
import { PuckData } from '@wepublish/puck-content/website';

import {
  initialPuckUi,
  puckEditorConfig,
  toEditorData,
  viewportPresets,
  visibleViewportPresets,
} from './puck-editor.config';

const data: Data = { root: { props: {} }, content: [] };

describe('puckEditorConfig', () => {
  it('gives articles the article root fields', () => {
    const fields = Object.keys(
      puckEditorConfig('article', data).root?.fields ?? {}
    );

    expect(fields).toEqual(
      expect.arrayContaining(['preTitle', 'authorIds', 'paywallId'])
    );
    expect(fields).not.toContain('showFooter');
  });

  it('gives pages the page root fields', () => {
    const fields = Object.keys(
      puckEditorConfig('page', data).root?.fields ?? {}
    );

    expect(fields).toEqual(
      expect.arrayContaining(['showNavigation', 'showFooter'])
    );
    expect(fields).not.toContain('authorIds');
  });

  it('keeps the components the AI designed for the document', () => {
    expect(puckEditorConfig('page', data).root?.fields).toHaveProperty(
      '_dynamicConfig'
    );
  });
});

describe('toEditorData', () => {
  it('hands the document data to puck as it is', () => {
    const document: PuckData<'article'> = {
      root: { props: { title: 'Title' } },
      content: [],
    };

    expect(toEditorData('article', document)).toBe(document);
  });
});

describe('viewportPresets', () => {
  const breakpoints = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 };

  it('offers a small phone, every theme breakpoint and the ultra wide screens from narrow to wide', () => {
    expect(viewportPresets(breakpoints)).toEqual([
      { width: 360, height: 780, label: 'Small', device: 'phone' },
      { width: 600, height: 1300, label: 'sm', device: 'phone' },
      { width: 900, height: 1950, label: 'md', device: 'tablet' },
      { width: 1200, height: 675, label: 'lg', device: 'desktop' },
      { width: 1536, height: 864, label: 'xl', device: 'desktop' },
      { width: 2560, height: 'auto', label: 'Ultra Wide', device: 'ultraWide' },
      { width: 3840, height: 'auto', label: '4k', device: '4k' },
    ]);
  });

  it('keeps the presets sorted when a theme breakpoint is narrower than the small phone', () => {
    expect(
      viewportPresets({ xs: 0, sm: 320 }).map(preset => preset.width)
    ).toEqual([320, 360, 2560, 3840]);
  });
});

describe('visibleViewportPresets', () => {
  const presets = viewportPresets({
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  });

  it('offers every preset on a wide screen', () => {
    expect(visibleViewportPresets(presets, 1440)).toEqual(presets);
  });

  it('hides the presets a narrow screen could only show below a third of their size', () => {
    expect(
      visibleViewportPresets(presets, 900).map(preset => preset.label)
    ).toEqual(['Small', 'sm', 'md', 'lg', 'xl', 'Ultra Wide']);
    expect(
      visibleViewportPresets(presets, 640).map(preset => preset.label)
    ).toEqual(['Small', 'sm', 'md', 'lg', 'xl']);
  });

  it('lets the previews fill the canvas height on a phone instead of shrinking them to fit', () => {
    expect(visibleViewportPresets(presets, 375)).toEqual([
      { width: 360, height: 'auto', label: 'Small', device: 'phone' },
      { width: 600, height: 'auto', label: 'sm', device: 'phone' },
      { width: 900, height: 'auto', label: 'md', device: 'tablet' },
    ]);
  });

  it('always keeps the narrowest preset', () => {
    expect(
      visibleViewportPresets(presets, 40).map(preset => preset.label)
    ).toEqual(['Small']);
  });
});

describe('initialPuckUi', () => {
  it('leaves the layout to puck on a wide screen', () => {
    expect(initialPuckUi(undefined, 1440)).toBeUndefined();
  });

  it('starts with the blocks sidebar closed when both sidebars would squeeze the canvas', () => {
    expect(initialPuckUi(undefined, 1023)).toEqual({
      leftSideBarVisible: false,
    });
  });

  it('keeps both sidebars on a landscape tablet', () => {
    expect(initialPuckUi(undefined, 1024)).toBeUndefined();
  });

  it('reopens the plugin the editor came back to next to the fields', () => {
    expect(initialPuckUi('revisioning', 1440)).toEqual({
      plugin: { current: 'revisioning' },
    });
  });

  it('reopens the plugin the editor came back to in place of the fields on a narrow screen', () => {
    expect(initialPuckUi('revisioning', 800)).toEqual({
      plugin: { current: 'revisioning' },
      leftSideBarVisible: true,
      rightSideBarVisible: false,
    });
  });
});
