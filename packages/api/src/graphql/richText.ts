import {createRichTextScalar} from '@karma.run/graphql'

export const GraphQLRichText = createRichTextScalar({
  validation: {
    block: {},
    inline: {},
    marks: {}
  }
})
