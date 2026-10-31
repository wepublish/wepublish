import { omit } from 'ramda';

import {
  generatedComponentScript,
  generatedDynamicConfig,
  GeneratedRegistryInput,
  hasGeneratedComponent,
  toGeneratedRegistry,
} from './generated-registry';

const hero = {
  label: 'Hero',
  html: '<h2 data-puck-field-name="title">Placeholder</h2>',
  styles: '.hero{color:red}',
  defaultProps: { title: 'Placeholder' },
  fields: { content: { type: 'slot' } },
  script: 'document.title = "hero";',
  custom: { kept: true },
};

const input = (
  fields: Partial<GeneratedRegistryInput> = {}
): GeneratedRegistryInput => ({
  components: { Hero: hero, Card: { html: '<article></article>' } },
  styles: '.page{margin:0}',
  script: 'document.title = "page";',
  ...fields,
});

describe('toGeneratedRegistry', () => {
  it('gives registries with equal content the same hash, whatever the key order', () => {
    const reordered = input({
      components: {
        Card: { html: '<article></article>' },
        Hero: Object.fromEntries(Object.entries(hero).reverse()),
      },
    });

    expect(toGeneratedRegistry(reordered).hash).toBe(
      toGeneratedRegistry(input()).hash
    );
  });

  it('gives registries with other html, styles or scripts another hash', () => {
    const hash = toGeneratedRegistry(input()).hash;

    expect(
      [
        input({ components: { Hero: { ...hero, html: '<h3></h3>' } } }),
        input({ components: { Hero: { ...hero, script: 'void 0;' } } }),
        input({ styles: '.page{margin:1px}' }),
        input({ script: null }),
      ].map(other => toGeneratedRegistry(other).hash)
    ).not.toContain(hash);
  });

  it('treats a registry without a components record as empty', () => {
    const registry = toGeneratedRegistry(input({ components: null }));

    expect(registry.components).toEqual({});
    expect(hasGeneratedComponent(registry, 'Hero')).toBe(false);
  });
});

describe('hasGeneratedComponent', () => {
  it('knows only the components the registry has', () => {
    const registry = toGeneratedRegistry(input());

    expect(hasGeneratedComponent(registry, 'Hero')).toBe(true);
    expect(hasGeneratedComponent(registry, 'Unknown')).toBe(false);
    expect(hasGeneratedComponent(registry, 'toString')).toBe(false);
  });
});

describe('generatedDynamicConfig', () => {
  it('hands Puck every registration under its own name without its script', () => {
    expect(generatedDynamicConfig(toGeneratedRegistry(input()))).toEqual({
      components: {
        Hero: omit(['script'], hero),
        Card: { html: '<article></article>' },
      },
    });
  });
});

describe('generatedComponentScript', () => {
  it('reads the script of a component', () => {
    const registry = toGeneratedRegistry(input());

    expect(generatedComponentScript(registry, 'Hero')).toBe(
      'document.title = "hero";'
    );
    expect(generatedComponentScript(registry, 'Card')).toBeNull();
    expect(generatedComponentScript(registry, 'Unknown')).toBeNull();
  });
});
