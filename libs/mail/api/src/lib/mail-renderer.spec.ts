import { composeMail, flattenMailData, renderTemplate } from './mail-renderer';

describe('flattenMailData', () => {
  it('flattens nested objects with underscore-separated keys', () => {
    const result = flattenMailData({
      user: { id: '1', firstName: 'Jane' },
      jwt: 'token',
    });

    expect(result).toMatchObject({
      user_id: '1',
      user_firstName: 'Jane',
      jwt: 'token',
    });
  });

  it('flattens arrays using their index', () => {
    const result = flattenMailData({
      optional: { items: [{ name: 'a' }, { name: 'b' }] },
    });

    expect(result).toMatchObject({
      optional_items_0_name: 'a',
      optional_items_1_name: 'b',
    });
  });

  it('keeps primitives as-is', () => {
    const result = flattenMailData({ count: 3, flag: true });

    expect(result.count).toBe(3);
    expect(result.flag).toBe(true);
  });
});

describe('renderTemplate', () => {
  it('replaces a placeholder with its value', () => {
    expect(
      renderTemplate('Hi {{user_firstName}}!', { user_firstName: 'Jane' })
    ).toBe('Hi Jane!');
  });

  it('replaces all occurrences of the same placeholder', () => {
    expect(renderTemplate('{{a}}-{{a}}', { a: 'x' })).toBe('x-x');
  });

  it('tolerates whitespace inside the braces', () => {
    expect(renderTemplate('{{ user_id }}', { user_id: '42' })).toBe('42');
  });

  it('replaces unknown placeholders with an empty string', () => {
    expect(renderTemplate('Hi {{missing}}!', {})).toBe('Hi !');
  });

  it('returns an empty string for empty input', () => {
    expect(renderTemplate('', { a: 'x' })).toBe('');
    expect(renderTemplate(undefined, { a: 'x' })).toBe('');
  });
});

describe('composeMail', () => {
  it('renders subject, html and text from the flattened data', () => {
    const result = composeMail(
      {
        subject: 'Welcome {{user_firstName}}',
        htmlContent: '<p>Hi {{user_firstName}}</p>',
        textContent: 'Hi {{user_firstName}}',
      },
      { user: { firstName: 'Jane' } }
    );

    expect(result).toEqual({
      subject: 'Welcome Jane',
      messageHtml: '<p>Hi Jane</p>',
      message: 'Hi Jane',
    });
  });

  it('leaves message undefined when there is no text content', () => {
    const result = composeMail(
      { subject: 's', htmlContent: '<p>h</p>', textContent: null },
      {}
    );

    expect(result.message).toBeUndefined();
  });
});
