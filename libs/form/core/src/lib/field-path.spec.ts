import {
  joinPath,
  parentPath,
  lastSegment,
  resolvePath,
  schemaPathOf,
} from './field-path';

describe('joinPath', () => {
  it.each([
    ['', 'title', 'title'],
    ['link', 'url', 'link.url'],
    ['link', '', 'link'],
    ['', '', ''],
  ])('joins "%s" and "%s"', (prefix, key, joined) => {
    expect(joinPath(prefix, key)).toBe(joined);
  });
});

describe('parentPath and lastSegment', () => {
  it.each([
    ['title', '', 'title'],
    ['links.*.url', 'links.*', 'url'],
    ['links.0', 'links', '0'],
  ])('splits "%s"', (path, parent, last) => {
    expect(parentPath(path)).toBe(parent);
    expect(lastSegment(path)).toBe(last);
  });
});

describe('resolvePath', () => {
  it('keeps paths without items', () => {
    expect(resolvePath('link.url', {})).toBe('link.url');
  });

  it('resolves * from the item scope', () => {
    expect(resolvePath('actions.*.label', { actions: 'actions.2' })).toBe(
      'actions.2.label'
    );
  });

  it('resolves nested items from their own scope', () => {
    expect(
      resolvePath('links.*.items.*.title', {
        links: 'links.1',
        'links.*.items': 'links.1.items.3',
      })
    ).toBe('links.1.items.3.title');
  });

  it('throws for * outside an item', () => {
    expect(() => resolvePath('actions.*.label', {})).toThrow(
      '"actions.*.label" uses "*" outside an item of "actions".'
    );
  });
});

describe('schemaPathOf', () => {
  it.each([
    ['title', 'title'],
    ['actions.0.label', 'actions.*.label'],
    ['links.1.items.12', 'links.*.items.*'],
    ['actions.root', 'actions'],
    ['actions.0.tags.root', 'actions.*.tags'],
    ['root.schema', 'root.schema'],
  ])('maps "%s" to "%s"', (path, schemaPath) => {
    expect(schemaPathOf(path)).toBe(schemaPath);
  });
});
