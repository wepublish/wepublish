import {cssRule, useStyle} from '@karma.run/react'
import React, {useState} from 'react'
import {BaseButton} from '../atoms/baseButton'
import {Image} from '../atoms/image'
import {Color} from '../style/colors'

interface Comment {
  id: string
  userID: string
  authorType: string
  parentID?: string
  revisions: GraphQLCommentRevision[]
  state: string
  rejectionReason?: string
  createdAt: Date
  modifiedAt: Date
}

interface GraphQLCommentRevision {
  text: string
  createdAt: Date
}

const comments: Comment[] = [
  {
    id: '1',
    userID: 'Peter',
    state: 'Approved',
    authorType: 'VerifiedUser',
    revisions: [
      {
        text: 'Hello World',
        createdAt: new Date(Date.now() - 9000000)
      },
      {
        text: 'First revision',
        createdAt: new Date(Date.now() - 900000)
      },
      {
        text: 'New Text',
        createdAt: new Date(Date.now())
      }
    ],
    createdAt: new Date('2021-01-20'),
    modifiedAt: new Date(Date.now())
  },
  {
    id: '2',
    userID: 'Sauron',
    state: 'Approved',
    authorType: 'VerifiedUser',
    revisions: [
      {
        text: "I don't like this article",
        createdAt: new Date(Date.now() - 10000)
      }
    ],
    createdAt: new Date('2021-01-20'),
    modifiedAt: new Date(Date.now() - 10000)
  },
  {
    id: '3',
    userID: 'Tom Bombadil',
    state: 'Approved',
    parentID: '2',
    authorType: 'Team',
    revisions: [
      {
        text: 'Sauron, please...',
        createdAt: new Date(Date.now())
      }
    ],
    createdAt: new Date('2021-01-20'),
    modifiedAt: new Date(Date.now())
  },
  {
    id: '4',
    userID: 'Tom Bombadil',
    state: 'Approved',
    parentID: '1',
    authorType: 'Team',
    revisions: [
      {
        text: 'Hello Peter',
        createdAt: new Date(Date.now())
      }
    ],
    createdAt: new Date('2021-01-20'),
    modifiedAt: new Date(Date.now())
  }
]

const parentComments = comments.filter(comment => comment.parentID === undefined)
const childComments = comments.filter(comment => comment.parentID !== undefined)

const restructuredComments = parentComments.map(comment => {
  return {
    id: comment.id,
    userID: comment.userID,
    authorType: comment.authorType,
    revisions: comment.revisions,
    state: comment.state,
    createdAt: comment.createdAt,
    modifiedAt: comment.modifiedAt,
    children: childComments.filter(child => child.parentID === comment.id)
  }
})

// CSS-Rules

const Container = cssRule(() => ({
  width: '500px',
  margin: '0 auto'
}))

const CommentBox = cssRule(() => ({
  marginTop: '2em'
}))

const CommentInputField = cssRule(() => ({
  resize: 'none',
  padding: '0.5em',
  width: '100%'
}))

const CommentAuthor = cssRule(() => ({
  margin: 0
}))

const CommentMeta = cssRule(() => ({
  fontSize: '0.8em',
  margin: '0 0 1em 0'
}))

const CommentBody = cssRule(() => ({
  margin: 0,
  fontSize: '0.9em'
}))

const CommentButton = cssRule(() => ({
  margin: 0,
  fontSize: '0.9em',
  color: '#FFFFFF',
  backgroundColor: '#000000',
  padding: '0.5em 1em',
  fontWeight: 'bold'
}))

const Flex = cssRule(() => ({
  display: 'flex'
}))

const Pointer = cssRule(() => ({
  cursor: 'Pointer',
  '&:hover': {
    textDecoration: 'underline'
  }
}))

const ReplyButton = cssRule(() => ({
  margin: 0,
  fontSize: '0.8em',
  color: Color.SecondaryDark,
  fontWeight: 'bold'
}))

const RightColumn = cssRule(() => ({
  paddingLeft: '1.2em',
  width: '100%'
}))

const SmallFont = cssRule(() => ({
  fontSize: '0.8em'
}))

const Timestamp = cssRule(() => ({
  color: Color.Neutral
}))

export interface ComposeCommentProps {
  readonly header?: string
  readonly parentCommentAuthor?: string
}

export function ComposeComment(props: ComposeCommentProps) {
  const css = useStyle()
  return (
    <div className={css(Container)}>
      {props.header ? <h3>{props.header}</h3> : ''}
      <form>
        <p>
          <textarea
            maxLength={1000}
            rows={4}
            cols={50}
            placeholder="Start writing your comment"
            className={css(CommentInputField)}
          />
        </p>
        <p>
          <BaseButton css={props.parentCommentAuthor ? ReplyButton : CommentButton}>
            {props.parentCommentAuthor ? 'Reply' : 'Post comment'}
          </BaseButton>
        </p>
      </form>
    </div>
  )
}

function Comment(props: any) {
  const css = useStyle()
  console.log(props.comment)

  return (
    <>
      <div className={css(Flex, CommentBox)} id={props.comment.id}>
        <div className="leftColumn" style={{width: 60}}>
          <Image src={'../../../static/icons/avatar.jpg'} />
        </div>
        <div className={css(RightColumn)}>
          <h4 className={css(CommentAuthor)}>{props.comment.userID}</h4>
          <p className={css(CommentMeta)}>
            <span>{props.comment.authorType}</span> ·{' '}
            <span className={css(Timestamp)}>
              {props.comment.modifiedAt.toLocaleString('de-DE')}
            </span>
          </p>
          <p className={css(CommentBody)}>
            {props.comment.revisions.slice(props.comment.revisions.length - 1)[0].text}
          </p>
          <p className={css(SmallFont)}>
            <span
              className={css(Pointer)}
              onClick={() =>
                props.handleCurrentComment(
                  props.comment.id === props.activeComment ? '' : props.comment.id
                )
              }>
              Answer
            </span>
            <span> | Report</span>
          </p>
        </div>
      </div>
      <div>
        {props.activeComment === props.comment.id ? (
          <ComposeComment parentCommentAuthor={props.comment.userID} />
        ) : (
          ''
        )}
      </div>
      <div>
        {props.comment.children.map((childComment: Comment) => {
          return childComment.userID
        })}
      </div>
    </>
  )
}

export function CommentList() {
  const css = useStyle()

  const [commentID, setCommentID] = useState('')

  return (
    <div className={css(Container, CommentBox)}>
      <h3>Show all comments</h3>
      {restructuredComments.map(parentComment => (
        <Comment
          comment={parentComment}
          key={parentComment.id}
          handleCurrentComment={(commentID: React.SetStateAction<string>) =>
            setCommentID(commentID)
          }
          activeComment={commentID}
        />
      ))}
    </div>
  )
}
