export const faker = {
  lorem: {
    word: () => 'word',
    words: (count?: number) =>
      Array(count || 3)
        .fill('word')
        .join(' '),
    sentence: () => 'This is a sentence.',
    sentences: (count?: number) =>
      Array(count || 3)
        .fill('This is a sentence.')
        .join(' '),
    paragraph: () => 'This is a paragraph with multiple sentences.',
    paragraphs: (count?: number) =>
      Array(count || 3)
        .fill('This is a paragraph.')
        .join('\n\n'),
    text: () => 'This is some text.',
    slug: () => 'slug',
    lines: (count?: number) =>
      Array(count || 3)
        .fill('line')
        .join('\n'),
  },
  word: {
    noun: () => 'test-tag',
    adjective: () => 'test-adjective',
    verb: () => 'test-verb',
  },
  string: {
    nanoid: () => 'test-nanoid-123',
    uuid: () => '123e4567-e89b-12d3-a456-426614174000',
    alphanumeric: (length?: number) => 'a'.repeat(length || 10),
  },
  person: {
    firstName: () => 'John',
    lastName: () => 'Doe',
    fullName: () => 'John Doe',
  },
  internet: {
    email: () => 'test@example.com',
    url: () => 'https://example.com',
    userName: () => 'username',
  },
  datatype: {
    uuid: () => '123e4567-e89b-12d3-a456-426614174000',
    number: (options: { min?: number; max?: number }) => {
      if (typeof options === 'object' && options !== null) {
        const min = options.min || 0;
        const max = options.max || 100;
        return Math.floor((min + max) / 2);
      }
      return 42;
    },
    boolean: () => true,
  },
  date: {
    past: () => new Date('2020-01-01'),
    future: () => new Date('2025-01-01'),
    recent: () => new Date(),
  },
  image: {
    url: () => 'https://example.com/image.jpg',
    dataUri: () =>
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  helpers: {
    arrayElement: (array: Array<any>) => array[0],
    arrayElements: (array: Array<any>, count?: number) =>
      array.slice(0, count || 1),
  },
};
