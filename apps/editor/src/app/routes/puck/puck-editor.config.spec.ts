import { Data } from '@puckeditor/core';
import { PuckData } from '@wepublish/puck-content/editor';

import {
  initialPuckUi,
  puckEditorConfig,
  toEditorData,
  viewportPresets,
  blockTemplateEditorConfig,
  dynamicComponentsKey,
  visibleViewportPresets,
  withTemplateFields,
} from './puck-editor.config';

const data: Data = { root: { props: {} }, content: [] };

describe('withTemplateFields', () => {
  it.each(['article', 'page'] as const)(
    'puts the name of a %s template first and leaves out the slug',
    kind => {
      const root = withTemplateFields(
        puckEditorConfig(kind, data),
        'Name'
      ).root;
      const fields = Object.keys(root?.fields ?? {});

      expect(fields[0]).toBe('templateName');
      expect(root?.fields?.['templateName' as never]).toEqual(
        expect.objectContaining({ type: 'custom', label: 'Name' })
      );
      expect(fields).not.toContain('slug');
      expect(fields).toContain('title');
      expect(fields).toContain('_dynamicConfig');
    }
  );

  it('keeps the root rendering and field tabs of the document', () => {
    const config = puckEditorConfig('article', data);
    const template = withTemplateFields(config, 'Name');

    expect(template.root?.render).toBe(config.root?.render);
    expect(template.root?.renderFields).toBe(config.root?.renderFields);
    expect(template.components).toBe(config.components);
  });
});

describe('blockTemplateEditorConfig', () => {
  it('only asks for the name of a block template', () => {
    const fields = Object.keys(
      blockTemplateEditorConfig(data, 'Name').root?.fields ?? {}
    );

    expect(fields).toEqual(['templateName', '_dynamicConfig']);
  });

  it('asks for the name in a field password managers leave alone', () => {
    expect(
      blockTemplateEditorConfig(data, 'Name').root?.fields?.[
        'templateName' as never
      ]
    ).toEqual(expect.objectContaining({ type: 'custom', label: 'Name' }));
  });

  it('renders the blocks without the navigation and footer of a page', () => {
    const page = puckEditorConfig('page', data);
    const template = blockTemplateEditorConfig(data, 'Name');

    expect(template.root?.render).not.toBe(page.root?.render);
    expect(Object.keys(template.components)).toEqual(
      Object.keys(page.components)
    );
  });
});

describe('dynamicComponentsKey', () => {
  it('changes only when the generated components of the document change', () => {
    const withHero = {
      root: {
        props: { _dynamicConfig: { components: { Hero: { html: '' } } } },
      },
      content: [],
    } as Data;

    expect(dynamicComponentsKey(data)).toBe('');
    expect(dynamicComponentsKey(withHero)).toBe('Hero');
  });
});

describe('puckEditorConfig', () => {
  it('can drop saved blocks, but never lists the placeholder', () => {
    expect(puckEditorConfig('article', data).components).toHaveProperty(
      'SavedBlocks',
      expect.objectContaining({ hidden: true })
    );
  });

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
      { width: 360, height: 'auto', label: 'Small', device: 'phone' },
      { width: 600, height: 'auto', label: 'sm', device: 'phone' },
      { width: 900, height: 'auto', label: 'md', device: 'tablet' },
      { width: 1200, height: 'auto', label: 'lg', device: 'desktop' },
      { width: 1536, height: 'auto', label: 'xl', device: 'desktop' },
      { width: 2560, height: 'auto', label: 'Ultra wide', device: 'ultraWide' },
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
    ).toEqual(['Small', 'sm', 'md', 'lg', 'xl', 'Ultra wide']);
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
