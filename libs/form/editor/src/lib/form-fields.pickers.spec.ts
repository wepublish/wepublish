import { type FullUserFragment, TagType } from '@wepublish/editor/api';
import {
  clearedValue,
  fieldMeta,
  isRequired,
  resolveKind,
} from '@wepublish/form/core';
import type { UserSearchValue } from '@wepublish/ui/editor';

import { formFields } from './form-fields';

describe('formFields pickers', () => {
  it('marks an image object that is required unless it is made nullish', () => {
    const logo = formFields.image();
    const image = formFields
      .image()
      .nullish()
      .meta({ label: 'event.form.image' });

    expect(resolveKind(logo)?.kind).toBe('image');
    expect(resolveKind(image)?.kind).toBe('image');
    expect(fieldMeta(image).label).toBe('event.form.image');
    expect(isRequired(logo)).toBe(true);
    expect(isRequired(image)).toBe(false);
    expect(clearedValue(image)).toBeNull();
    expect(
      logo.safeParse({ id: 'image-1', largeURL: 'https://example.com/a.jpg' })
        .data
    ).toEqual({
      id: 'image-1',
      largeURL: 'https://example.com/a.jpg',
    });
    expect(logo.safeParse(null).error?.issues[0]?.message).toBe(
      'form.errors.required'
    );
  });

  it('marks a user object that is required unless it is made nullish', () => {
    const user = formFields.user();

    expect(resolveKind(user)?.kind).toBe('user');
    expect(isRequired(user)).toBe(true);
    expect(isRequired(user.nullish())).toBe(false);
    expect(user.safeParse(undefined).error?.issues[0]?.message).toBe(
      'form.errors.required'
    );
  });

  it('types a user by the fields the form loads and keeps the full user by default', () => {
    const owner = formFields.user<UserSearchValue>();
    const subscriber = formFields.user();
    const loaded = {
      __typename: 'User' as const,
      id: 'user-1',
      name: 'Wyss',
      firstName: 'Matteo',
    };

    expectTypeOf(owner.parse).returns.toEqualTypeOf<UserSearchValue>();
    expectTypeOf(subscriber.parse).returns.toEqualTypeOf<FullUserFragment>();
    expect(resolveKind(owner)?.kind).toBe('user');
    expect(isRequired(owner)).toBe(true);
    expect(owner.parse(loaded)).toEqual(loaded);
    expect(owner.safeParse(null).error?.issues[0]?.message).toBe(
      'form.errors.required'
    );
  });

  it('marks tag ids and passes the tag type on as a kind parameter', () => {
    const tags = formFields
      .tags(TagType.Author)
      .min(1)
      .meta({ label: 'author.tags' });

    expect(resolveKind(tags)).toMatchObject({
      kind: 'tags',
      params: { tagType: TagType.Author },
    });
    expect(clearedValue(tags)).toEqual([]);
    expect(isRequired(tags)).toBe(true);
    expect(isRequired(formFields.tags(TagType.Event))).toBe(false);
    expect(tags.parse(['tag-1'])).toEqual(['tag-1']);
  });

  it.each([
    ['page', formFields.page()],
    ['article', formFields.article()],
    ['paywall', formFields.paywall()],
    ['memberPlan', formFields.memberPlan()],
  ] as const)(
    'marks a single %s id that is required unless it is made nullish',
    (kind, schema) => {
      expect(resolveKind(schema)?.kind).toBe(kind);
      expect(resolveKind(schema.nullish())?.kind).toBe(kind);
      expect(isRequired(schema)).toBe(true);
      expect(isRequired(schema.nullish())).toBe(false);
      expect(clearedValue(schema.nullish())).toBeNull();
      expect(schema.parse('id-1')).toBe('id-1');
      expect(schema.safeParse('').success).toBe(false);
    }
  );

  it.each([
    ['pages', formFields.pages()],
    ['memberPlans', formFields.memberPlans()],
  ] as const)('marks a list of %s ids that may stay empty', (kind, schema) => {
    expect(resolveKind(schema)?.kind).toBe(kind);
    expect(isRequired(schema)).toBe(false);
    expect(isRequired(schema.min(1))).toBe(true);
    expect(clearedValue(schema)).toEqual([]);
    expect(schema.parse(['id-1', 'id-2'])).toEqual(['id-1', 'id-2']);
  });
});
