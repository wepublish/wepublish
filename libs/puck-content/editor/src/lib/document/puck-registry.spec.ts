import { FullPuckRegistryFragment } from '@wepublish/editor/api';

import {
  isDynamicConfigStreaming,
  PuckDynamicConfig,
  readDynamicConfig,
  toDynamicConfig,
  toPuckRegistryInput,
} from './puck-registry';

const fields = {
  content: { type: 'slot' },
  title: { type: 'text' },
};

const dynamicConfig: PuckDynamicConfig = {
  components: {
    Hero: {
      html: '<section data-puck-slot="content"><h1 data-puck-field-name="title">Hi</h1></section>',
      label: 'Hero',
      styles: '.hero { color: red; }',
      script: 'document.querySelector(".hero")',
      fields,
      defaultProps: { title: 'Hi' },
    },
    Plain: { html: '<p>Plain</p>' },
  },
  styles: ':root { --accent: red; }',
  script: 'console.log("ready")',
};

const fragment = (
  registry: Partial<FullPuckRegistryFragment>
): FullPuckRegistryFragment => ({
  __typename: 'PuckRegistry',
  components: {},
  styles: null,
  script: null,
  ...registry,
});

describe('toPuckRegistryInput', () => {
  it('keeps the components by name exactly as Puck keeps them, scripts included', () => {
    expect(toPuckRegistryInput(dynamicConfig)).toEqual(dynamicConfig);
  });

  it('keeps the streaming flag and the keys of a component it does not know', () => {
    expect(
      toPuckRegistryInput({
        components: {
          Hero: { html: '<p>Hi</p>', streaming: true, name: 'Hero' },
        },
        styles: '',
      })
    ).toStrictEqual({
      components: {
        Hero: { html: '<p>Hi</p>', streaming: true, name: 'Hero' },
      },
      styles: '',
    });
  });

  it('leaves out document keys the registry has no place for', () => {
    expect(
      toPuckRegistryInput({
        components: { Hero: { html: '<p>Hi</p>' } },
        version: 2,
      })
    ).toStrictEqual({ components: { Hero: { html: '<p>Hi</p>' } } });
  });

  it('stores a component Puck has not written any markup for yet with empty markup', () => {
    expect(
      toPuckRegistryInput({ components: { Hero: { label: 'Hero' } } })
    ).toEqual({ components: { Hero: { html: '', label: 'Hero' } } });
  });

  it('leaves out components and values that are not what Puck writes', () => {
    expect(
      toPuckRegistryInput({
        components: {
          Hero: { html: '<p>Hi</p>', label: 3, fields: [], defaultProps: 'x' },
          Broken: 'nonsense',
        },
        script: 7,
      })
    ).toStrictEqual({ components: { Hero: { html: '<p>Hi</p>' } } });
  });

  it.each([
    ['no dynamic config', undefined],
    ['an empty dynamic config', {}],
    ['a dynamic config without components', { components: {} }],
    ['something else', 'nonsense'],
  ])('clears the registry for %s', (_, value) => {
    expect(toPuckRegistryInput(value)).toBeNull();
  });
});

describe('toDynamicConfig', () => {
  it('hands the stored registry back to Puck in the shape Puck keeps it', () => {
    expect(
      toDynamicConfig(
        fragment({
          components: dynamicConfig.components,
          styles: dynamicConfig.styles,
          script: dynamicConfig.script,
        })
      )
    ).toEqual(dynamicConfig);
  });

  it('hands back the streaming flag and the keys of a component Puck wrote', () => {
    expect(
      toDynamicConfig(
        fragment({
          components: {
            Hero: { html: '<p>Hi</p>', streaming: true, name: 'Hero' },
          },
        })
      )
    ).toStrictEqual({
      components: {
        Hero: { html: '<p>Hi</p>', streaming: true, name: 'Hero' },
      },
    });
  });

  it('leaves out the styles and the script the registry does not have', () => {
    expect(
      toDynamicConfig(fragment({ components: { Plain: { html: '<p/>' } } }))
    ).toStrictEqual({ components: { Plain: { html: '<p/>' } } });
  });

  it('has no dynamic config without a registry', () => {
    expect(toDynamicConfig(null)).toBeUndefined();
    expect(toDynamicConfig(undefined)).toBeUndefined();
  });

  it('is undone by toPuckRegistryInput', () => {
    const input = toPuckRegistryInput(dynamicConfig);

    expect(
      toDynamicConfig(
        fragment({
          components: input?.components,
          styles: input?.styles ?? null,
          script: input?.script ?? null,
        })
      )
    ).toEqual(dynamicConfig);
  });
});

describe('readDynamicConfig', () => {
  it('reads the dynamic config Puck keeps in the root props', () => {
    expect(readDynamicConfig(dynamicConfig)).toEqual(dynamicConfig);
  });

  it('has none for anything else', () => {
    expect(readDynamicConfig(undefined)).toBeUndefined();
    expect(readDynamicConfig(['nonsense'])).toBeUndefined();
  });
});

describe('isDynamicConfigStreaming', () => {
  it('is true while Puck AI still writes one of the components', () => {
    expect(
      isDynamicConfigStreaming({
        components: {
          Plain: { html: '<p/>' },
          Hero: { html: '<section><h1>Ha', streaming: true },
        },
      })
    ).toBe(true);
  });

  it('is false once every component is settled', () => {
    expect(isDynamicConfigStreaming(dynamicConfig)).toBe(false);
    expect(
      isDynamicConfigStreaming({
        components: { Hero: { html: '<p/>', streaming: false } },
      })
    ).toBe(false);
  });

  it('is false without a dynamic config', () => {
    expect(isDynamicConfigStreaming(undefined)).toBe(false);
    expect(isDynamicConfigStreaming('nonsense')).toBe(false);
  });
});
