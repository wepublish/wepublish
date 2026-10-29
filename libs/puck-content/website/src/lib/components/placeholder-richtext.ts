import { faker } from '@faker-js/faker';
import { RichtextJSONDocument } from '@wepublish/richtext';

export const placeholderRichText = (): RichtextJSONDocument => ({
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [
        { type: 'text', attrs: undefined, text: faker.lorem.paragraph() },
      ],
    },
  ],
});
