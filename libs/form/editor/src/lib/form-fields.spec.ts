import { fieldMeta, fieldOptions, resolveKind } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { formFields } from './form-fields';

describe('formFields', () => {
  it('marks a multi-line text that keeps its kind through checks, wrappers and meta', () => {
    const html = formFields
      .textarea()
      .max(500)
      .optional()
      .meta({ label: 'banner.form.html' });

    expect(resolveKind(html)?.kind).toBe('textarea');
    expect(html.safeParse('a'.repeat(501)).success).toBe(false);
    expect(html.safeParse(undefined).success).toBe(true);
    expect(fieldMeta(html).label).toBe('banner.form.html');
  });

  it('marks a boolean as a switch', () => {
    const active = formFields.switch().default(false);

    expect(resolveKind(active)?.kind).toBe('switch');
    expect(active.parse(undefined)).toBe(false);
    expect(active.safeParse('yes').success).toBe(false);
  });

  it('marks an enum as a radio group and keeps its options and label prefix', () => {
    const position = formFields
      .radio(
        z
          .enum(['TOP', 'BOTTOM'])
          .meta({ optionLabelPrefix: 'banner.form.position.' })
      )
      .nullable();

    expect(resolveKind(position)?.kind).toBe('radio');
    expect(fieldOptions(position)).toEqual([
      { value: 'TOP', labelKey: 'banner.form.position.TOP' },
      { value: 'BOTTOM', labelKey: 'banner.form.position.BOTTOM' },
    ]);
    expect(position.safeParse('LEFT').success).toBe(false);
  });

  it('accepts a native enum for a radio group', () => {
    enum Status {
      Draft = 'DRAFT',
      Published = 'PUBLISHED',
    }

    const status = formFields.radio(z.enum(Status));

    expect(resolveKind(status)?.kind).toBe('radio');
    expect(status.parse('DRAFT')).toBe(Status.Draft);
  });
});
