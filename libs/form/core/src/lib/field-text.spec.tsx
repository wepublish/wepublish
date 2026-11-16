import { z } from 'zod/v4';
import { labelledOptions, translateText } from './field-text';

const t = (key: string, params?: Record<string, unknown>) =>
  params === undefined ? `t(${key})` : `t(${key}|${JSON.stringify(params)})`;

describe('translateText', () => {
  it('translates strings as keys', () => {
    expect(translateText(t, 'banner.title')).toBe('t(banner.title)');
  });

  it('keeps other nodes', () => {
    const node = <em>custom</em>;

    expect(translateText(t, node)).toBe(node);
    expect(translateText(t, undefined)).toBeUndefined();
    expect(translateText(t, 3)).toBe(3);
  });
});

describe('labelledOptions', () => {
  const status = z
    .enum(['ALL', 'LOGGED_IN'])
    .meta({ optionLabelPrefix: 'banner.status.' });

  it('labels schema values through the prefix', () => {
    expect(labelledOptions(status, {}, t)).toEqual([
      { value: 'ALL', label: 't(banner.status.ALL)' },
      { value: 'LOGGED_IN', label: 't(banner.status.LOGGED_IN)' },
    ]);
  });

  it('falls back to the raw value', () => {
    expect(labelledOptions(z.enum(['a', 'b']), {}, t)).toEqual([
      { value: 'a', label: 'a' },
      { value: 'b', label: 'b' },
    ]);
  });

  it('lets optionLabel win, translating keys and keeping nodes', () => {
    const node = <strong>logged in</strong>;
    const optionLabel = (value: unknown) =>
      value === 'ALL' ? 'everyone' : node;

    expect(labelledOptions(status, { optionLabel }, t)).toEqual([
      { value: 'ALL', label: 't(everyone)' },
      { value: 'LOGGED_IN', label: node },
    ]);
  });

  it('uses runtime options, labelling plain values and keeping given labels', () => {
    expect(
      labelledOptions(
        status,
        { options: ['LOGGED_IN', { value: 'ALL', label: 'All of them' }] },
        t
      )
    ).toEqual([
      { value: 'LOGGED_IN', label: 't(banner.status.LOGGED_IN)' },
      { value: 'ALL', label: 'All of them' },
    ]);
  });

  it('labels the elements of an enum array', () => {
    const roles = z
      .array(z.enum(['admin', 'editor']))
      .meta({ optionLabelPrefix: 'roles.' });

    expect(labelledOptions(roles, {}, t).map(option => option.label)).toEqual([
      't(roles.admin)',
      't(roles.editor)',
    ]);
  });

  it('is empty for fields without values', () => {
    expect(labelledOptions(z.string(), {}, t)).toEqual([]);
  });
});
