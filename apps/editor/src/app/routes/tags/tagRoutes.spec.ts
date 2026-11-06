import { TagType } from '@wepublish/editor/api';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(join(__dirname, '../../app.tsx'), 'utf8');

const tagView =
  /path="([^"]+)"\s+element=\{\s*<Base>\s*<(Tag(?:List|CreateView|EditView)) type=\{TagType\.(\w+)\} \/>/g;

const mounted = [...app.matchAll(tagView)].map(([, path, view, type]) => ({
  path: `/${path}`,
  view,
  type,
}));

const tagListOf: Record<TagType, string> = {
  [TagType.Article]: '/articles/tags',
  [TagType.Page]: '/pages/tags',
  [TagType.Comment]: '/comments/tags',
  [TagType.Event]: '/events/tags',
  [TagType.Author]: '/authors/tags',
};

describe('tag routes', () => {
  it.each(Object.values(TagType))(
    'mount the %s tag views with their own type',
    type => {
      const list = tagListOf[type];

      expect(mounted.filter(({ path }) => path.startsWith(list))).toStrictEqual(
        [
          { path: list, view: 'TagList', type },
          { path: `${list}/create`, view: 'TagCreateView', type },
          { path: `${list}/edit/:id`, view: 'TagEditView', type },
        ]
      );
    }
  );

  it('mount no tag view outside the five tag lists', () => {
    const lists = Object.values(tagListOf);

    expect(
      mounted.filter(({ path }) => !lists.some(list => path.startsWith(list)))
    ).toStrictEqual([]);
  });
});
