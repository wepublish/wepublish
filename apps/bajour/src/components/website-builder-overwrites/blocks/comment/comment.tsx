import {css} from '@emotion/react'
import {Theme, useTheme} from '@mui/material'
import {
  ApiV1,
  BuilderCommentProps,
  Comment,
  CommentAuthor,
  CommentContent,
  CommentFlair,
  CommentName
} from '@wepublish/website'

const bajourTags = {
  QuelleAlsLink: 'Quelle als Link',
  TopKommentar: 'Top Kommentar',
  QuelleHervorheben: 'Quelle hervorheben',
  Moderation: 'Moderation'
}

const highlightModeration = (theme: Theme) => css`
  ${CommentName},
  ${CommentFlair},
  ${CommentAuthor},
  ${CommentContent} {
    color: ${theme.palette.primary.main};
  }
`

const highlightSource = (theme: Theme) => css`
  ${CommentFlair} {
    color: ${theme.palette.primary.main};
  }
`

export const BajourComment = (props: BuilderCommentProps) => {
  const {tags} = props
  const theme = useTheme()

  const highlightSourceTag = tags.some((tag: ApiV1.Tag) => tag.tag === bajourTags.QuelleHervorheben)
  const moderationTag = tags.some((tag: ApiV1.Tag) => tag.tag === bajourTags.Moderation)

  const cssToPass = () => {
    if (moderationTag) {
      return highlightModeration(theme)
    }
    if (highlightSourceTag) {
      return highlightSource(theme)
    }
    return undefined
  }

  return <Comment {...props} css={cssToPass()} />
}
