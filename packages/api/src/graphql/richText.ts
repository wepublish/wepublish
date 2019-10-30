import {createRichTextScalar} from '@karma.run/graphql'

export const GraphQLRichText = createRichTextScalar({
  validation: {
    block: {
      'heading-one': null,
      'heading-two': null,
      'heading-three': null,
      'bulleted-list': null,
      'numbered-list': null,
      'list-item': null,
      paragraph: null
    },
    inline: {
      link: null
    },
    marks: {
      bold: null,
      italic: null
    }
  }
})
