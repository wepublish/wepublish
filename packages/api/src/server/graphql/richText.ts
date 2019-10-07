import {createRichTextScalar} from '@karma.run/graphql'

export const RichTextScalar = createRichTextScalar({
  validation: {
    block: {},
    inline: {},
    marks: {}
  }
})
