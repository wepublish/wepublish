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

  const commentStyles = moderationTag
    ? highlightModeration(theme)
    : highlightSourceTag
    ? highlightSource(theme)
    : undefined

  return <Comment {...props} css={commentStyles} />
}
