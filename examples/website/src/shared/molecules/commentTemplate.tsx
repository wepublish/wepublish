import {cssRule, useStyle} from '@karma.run/react'
import React, {useContext, useState} from 'react'
import {BaseButton} from '../atoms/baseButton'
import {Image} from '../atoms/image'
import {RichText} from '../atoms/richText'
import {Color} from '../style/colors'
import {Comment} from '../types'
import gql from 'graphql-tag'
import {useMutation} from '@apollo/react-hooks'
import {AuthContext} from '../authContext'
import {Link, LogoutRoute} from '../route/routeContext'

// CSS-Rules
// =========

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

// Interfaces
// ==========
export interface ComposeCommentProps {
  readonly header?: string
  readonly parentCommentAuthor?: string
  readonly role?: string
  readonly parentID?: string
  readonly itemID: string
  readonly itemType: string
}

export interface DisplayCommentsProps {
  readonly comments?: Comment[]
}

export interface LoginToComment {
  readonly itemType: string
  readonly itemID: string
}

// Queries
// =======

const AddComment = gql`
  mutation AddComment($input: CommentInput!) {
    addComment(input: $input) {
      user {
        id
      }
      text
      parentID
    }
  }
`

// Helpers
// =======

// This emulates a RichTextNode for as long as we haven't implemented it
function redressCommentInput(value: string) {
  return {
    type: 'paragraph',
    children: [{text: value}]
  }
}

// Components
// ==========

export function ComposeComment(props: ComposeCommentProps) {
  const css = useStyle()

  const [commentInput, setCommentInput] = useState({children: [{text: ''}]})
  const [commentState, setCommentState] = useState('')

  const {header, role, itemID, itemType, parentID} = props

  const [addComment, {loading}] = useMutation(AddComment, {
    onCompleted() {
      setCommentState('Your comment has been submitted and is awaiting approval')
    },
    onError: error => {
      console.error('Error creating a post', error)
      setCommentState("Something went wrong, your comment couldn't be saved")
    }
  })

  return (
    <div className={role === 'reply' ? css(ReplyBox) : css(Container)}>
      {header ? <h3>{header}</h3> : ''}
      <form
        onSubmit={e => {
          e.preventDefault()
          addComment({
            variables: {
              input: {
                parentID,
                text: [commentInput],
                itemID,
                itemType
              }
            }
          })
        }}>
        <p>
          <textarea
            maxLength={1000}
            rows={4}
            cols={50}
            placeholder="Start writing your comment"
            className={css(CommentInputField)}
            value={commentInput.children.map(child => child.text)}
            onChange={e => setCommentInput(redressCommentInput(e.target.value))}
          />
        </p>
        <p>
          <BaseButton
            css={props.parentCommentAuthor ? SmallButton : CommentButton}
            disabled={loading}>
            {props.parentCommentAuthor ? 'Submit' : 'Post comment'}
          </BaseButton>
        </p>
        {commentState && <p>{commentState}</p>}
      </form>
    </div>
  )
}

export function DisplayComments(props: DisplayCommentsProps) {
  const css = useStyle()

  const [commentID, setCommentID] = useState('')
  const {comments} = props

  return (
    <div className={css(Container, CommentBox)}>
      <h3>Show all comments</h3>
      {comments?.map(parentComment => (
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

function ParentComment(props: any) {
  const css = useStyle()

  const {id, userName, authorType, modifiedAt, children, text, itemID, itemType} = props.comment

  // This allows to display the children in a chronological order for the sake of a better UX
  let childrenReversed = [...children].reverse()

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
            <h4 className={css(CommentAuthor)}>{userName}</h4>
            <p className={css(CommentMeta)}>
              <span>{authorType}</span> ·{' '}
              <span className={css(Timestamp)}>{new Date(modifiedAt).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className={css(CommentBody)}>
          <RichText value={text} />
          <div className={css(Actions)}>
            <button
              className={css(SmallButton)}
              onClick={() => props.handleCurrentComment(id === activeComment ? '' : id)}>
              Reply
            </button>
            <button className={css(SmallButton)}>Edit</button>
          </div>
        </div>

        {props.activeComment === id ? (
          <ComposeComment itemID={itemID} itemType={itemType} role={'reply'} parentID={id} />
        ) : (
          ''
        )}
        {childrenReversed &&
          childrenReversed.map((child: any) => <ChildComment key={child.id} value={child} />)}
      </div>
    </div>
  )
}

function ChildComment(value: any) {
  const css = useStyle()

  const {id, user, authorType, modifiedAt, text} = value.value

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
          <h4 className={css(CommentAuthor)}>{user.name}</h4>
          <p className={css(CommentMeta)}>
            <span>{authorType}</span> ·{' '}
            <span className={css(Timestamp)}>{new Date(modifiedAt).toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className={css(CommentBody)}>
        <RichText value={text} />
        <div className={css(Actions)}>
          <button className={css(SmallButton)}>Edit</button>
        </div>
      </div>
    </div>
  )
}

export function LoginToComment(props: LoginToComment) {
  const {session} = useContext(AuthContext)
  const css = useStyle()

  return (
    <>
      {session && (
        <>
          <ComposeComment itemID={props.itemID} itemType={props.itemType} />
          <p className={css(Container)}>
            Logged in as {session?.email}. <Link route={LogoutRoute.create({})}>Logout</Link>
          </p>
        </>
      )}
      {!session && <p>Not logged in. Login to comment</p>}
    </>
  )
}
