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
  },
  {
    id: '5',
    userID: 'Tom Bombadil',
    state: 'Approved',
    parentID: '1',
    authorType: 'Team',
    revisions: [
      {
        text: 'How are you?',
        createdAt: new Date(Date.now())
      }
    ],
    createdAt: new Date('2021-01-20'),
    modifiedAt: new Date(Date.now())
  },
  {
    id: '6',
    userID: 'Sepp Blatter',
    state: 'Approved',
    authorType: 'VerifiedUser',
    revisions: [
      {
        text: "I'm innocent!",
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

const Actions = cssRule(() => ({
  width: '100%'
}))

const Container = cssRule(() => ({
  width: '500px',
  margin: '0 auto'
}))

const CommentBox = cssRule(() => ({
  margin: '1em auto',
  position: 'relative'
}))

const CommentInputField = cssRule(() => ({
  resize: 'none',
  padding: '0.5em',
  width: '100%'
}))

const CommentAuthor = cssRule(() => ({
  margin: 0,
  display: 'inline',
  textDecoration: 'none',
  '&:hover': {
    textDcoration: 'underline',
    cursor: 'pointer'
  }
}))

const CommentMeta = cssRule(() => ({
  fontSize: '0.8em',
  margin: '0 0 1em 0'
}))

const CommentBody = cssRule(() => ({
  margin: '1em 0 0 0',
  fontSize: '0.9em',
  padding: '0 1.2em 0 3.5em'
}))

const commentBorderLink = cssRule(() => ({
  display: 'block',
  position: 'absolute',
  top: '3.125em',
  left: 0,
  width: '.75em',
  height: 'calc(100% - 4.125em)',
  borderLeft: '.25em solid transparent',
  borderRight: '.25em solid transparent',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  backgroundClip: 'padding-box',
  margin: '1em 0 0 1em',
  '&:hover': {
    backgroundColor: Color.Neutral
  }
}))

const CommentButton = cssRule(() => ({
  margin: 0,
  fontSize: '0.9em',
  color: '#FFFFFF',
  backgroundColor: '#000000',
  padding: '0.5em 1em',
  fontWeight: 'bold',
  borderRadius: '.25em'
}))

const CommentHeading = cssRule(() => ({
  display: 'flex',
  alignItems: 'center',
  height: '50px',
  fontSize: '0.9em'
}))

const ReplyBox = cssRule(() => ({
  marginLeft: '3.2em'
}))

const Replies = cssRule(() => ({
  marginLeft: '3.2em'
}))

const RightColumn = cssRule(() => ({
  padding: '.15em 0 0 .5em',
  width: '100%'
}))

const SmallButton = cssRule(() => ({
  appearance: 'none',
  fontSize: '.9em',
  padding: '4px 8px',
  marginRight: '0.5em',
  color: 'rgba(0, 0, 0, 0.85)',
  backgroundColor: '#fff',
  border: '1px solid rgba(0, 0, 0, 0.2)',
  borderRadius: '.25em',
  '&:hover, active, focus': {
    cursor: 'pointer',
    backgroundColor: Color.Neutral
  }
}))

const SrOnly = cssRule(() => ({
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden'
}))

const Thread = cssRule(() => ({
  marginBottom: '3em'
}))

const Timestamp = cssRule(() => ({
  color: Color.Neutral
}))

export interface ComposeCommentProps {
  readonly header?: string
  readonly parentCommentAuthor?: string
  readonly role?: string
}

// Functions

export function ComposeComment(props: ComposeCommentProps) {
  const css = useStyle()
  return (
    <div className={props.role === 'reply' ? css(ReplyBox) : css(Container)}>
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
          <BaseButton css={props.parentCommentAuthor ? SmallButton : CommentButton}>
            {props.parentCommentAuthor ? 'Submit' : 'Post comment'}
          </BaseButton>
        </p>
      </form>
    </div>
  )
}

function ParentComment(props: any) {
  const css = useStyle()

  const {id, userID, authorType, modifiedAt, revisions, children} = props.comment
  const {activeComment} = props

  return (
    <div className={css(Thread)}>
      <div className={css(CommentBox)} id={id}>
        <a href={'#' + id} className={css(commentBorderLink)}>
          <span className={css(SrOnly)}>Jump to comment {id}</span>
        </a>
        <div className={css(CommentHeading)}>
          <div style={{width: 50}}>
            <Image src={'../../../static/icons/avatar.jpg'} />
          </div>
          <div className={css(RightColumn)}>
            <h4 className={css(CommentAuthor)}>{userID}</h4>
            <p className={css(CommentMeta)}>
              <span>{authorType}</span> ·{' '}
              <span className={css(Timestamp)}>{modifiedAt.toLocaleString('de-DE')}</span>
            </p>
          </div>
        </div>

        <div className={css(CommentBody)}>
          <p>{revisions.slice(revisions.length - 1)[0].text}</p>
          <div className={css(Actions)}>
            <button
              className={css(SmallButton)}
              onClick={() => props.handleCurrentComment(id === activeComment ? '' : id)}>
              Reply
            </button>
            <button className={css(SmallButton)}>Report</button>
          </div>
        </div>

        {props.activeComment === id ? (
          <ComposeComment parentCommentAuthor={userID} role={'reply'} />
        ) : (
          ''
        )}
        {children && children.map((child: any) => <ChildComment key={child.id} value={child} />)}
      </div>
    </div>
  )
}

function ChildComment(child: any) {
  const css = useStyle()

  const {id, userID, authorType, modifiedAt, revisions} = child.value

  return (
    <div className={css(CommentBox, Replies)} id={id}>
      <a href={'#' + id} className={css(commentBorderLink)}>
        <span className={css(SrOnly)}>Jump to comment {id}</span>
      </a>
      <div className={css(CommentHeading)}>
        <div style={{width: 50}}>
          <Image src={'../../../static/icons/avatar.jpg'} />
        </div>
        <div className={css(RightColumn)}>
          <h4 className={css(CommentAuthor)}>{userID}</h4>
          <p className={css(CommentMeta)}>
            <span>{authorType}</span> ·{' '}
            <span className={css(Timestamp)}>{modifiedAt.toLocaleString('de-DE')}</span>
          </p>
        </div>
      </div>

      <div className={css(CommentBody)}>
        <p>{revisions.slice(revisions.length - 1)[0].text}</p>
        <div className={css(Actions)}>
          <button className={css(SmallButton)}>Report</button>
        </div>
      </div>
    </div>
  )
}

export function CommentList() {
  const css = useStyle()

  const [commentID, setCommentID] = useState('')

  return (
    <div className={css(Container, CommentBox)}>
      <h3>Show all comments</h3>
      {restructuredComments.map(parentComment => (
        <ParentComment
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
