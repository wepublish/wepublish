import {cssRule, useStyle} from '@karma.run/react'
import React, {useContext, useState, useEffect} from 'react'
import {BaseButton} from '../atoms/baseButton'
import {Color} from '../style/colors'
import {Comment, RichTextBlockValue} from '../types'
import {AddComment, UpdateComment, ArticleQuery} from '../query'
import {useMutation} from '@apollo/client'
import {AuthContext} from '../authContext'
import {Link, LoginRoute, LogoutRoute} from '../route/routeContext'
import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {useRoute} from '../route/routeContext'

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
  margin: '0'
}))

const CommentBody = cssRule(() => ({
  margin: '-.75em 0 0 0',
  fontSize: '0.9em',
  padding: '0 1.2em 0 3.5em',
  '& > div > p': {
    marginBottom: 0
  }
}))

const commentBorderLink = cssRule(() => ({
  display: 'block',
  position: 'absolute',
  top: '2.25em',
  left: 0,
  width: '.75em',
  height: 'calc(100% - 3em)',
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
  margin: '1em 0 0 0',
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

const CommentInput = cssRule(() => ({
  borderRadius: '.25em',
  fontSize: '0.9em',
  marginTop: '1em',
  '& > div': {
    borderRadius: '.25em',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    fontSize: '0.9em',
    padding: '0.5em 1em',
    marginTop: '1em'
  }
}))

const EditCommentInput = cssRule(() => ({
  borderRadius: '.25em',
  fontSize: '0.9em',
  padding: '0.5em',
  marginTop: '1em',
  '& > div': {
    borderRadius: '.25em',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    fontSize: '0.9em',
    padding: '0.5em 1em',
    marginTop: '1em'
  }
}))

const PendingApproval = cssRule(() => ({
  fontSize: '.9em',
  padding: '4px 8px',
  marginLeft: '-0.5em',
  color: Color.Highlight
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
  marginTop: '1em',
  color: 'rgba(0, 0, 0, 0.85)',
  backgroundColor: '#fff',
  border: '1px solid rgba(0, 0, 0, 0.2) !important',
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

const StateMessage = cssRule(() => ({
  fontSize: '0.9em'
}))

const Thread = cssRule(() => ({
  marginBottom: '2.5em'
}))

const Timestamp = cssRule(() => ({
  color: Color.Neutral
}))

// Interfaces
// ==========

export interface CommentProps {
  readonly comment: Comment
  readonly activeComment?: string
}

export interface ComposeCommentProps {
  readonly commentComposerHeader?: string
  readonly CommentAuthor?: string
  readonly role?: string
  readonly parentID?: string
  readonly itemID?: string
  readonly slug?: string
  readonly itemType: string
}

export interface CommentListProps {
  readonly comments?: Comment[]
}

export interface LoginToComment {
  readonly itemType: string
  readonly itemID?: string
  readonly slug?: string
}

// Components
// ==========

export function ComposeComment(props: ComposeCommentProps) {
  const css = useStyle()

  const [commentInput, setCommentInput] = useState<RichTextBlockValue>(createDefaultValue())
  const [commentStateInfo, setcommentStateInfo] = useState('')

  const {commentComposerHeader, role, itemID, itemType, parentID} = props

  const [addComment, {loading}] = useMutation(AddComment, {
    onCompleted() {
      setcommentStateInfo('Your comment has been submitted and is awaiting approval')
    },
    onError: error => {
      console.error('Error creating a post', error)
      setcommentStateInfo("Something went wrong, your comment couldn't be saved")
    }
  })

  return (
    <div className={role === 'reply' ? css(ReplyBox) : css(Container)}>
      {commentComposerHeader ? <h3>{commentComposerHeader}</h3> : ''}
      <form
        onSubmit={e => {
          e.preventDefault()
          addComment({
            variables: {
              input: {
                parentID,
                text: commentInput,
                itemID,
                itemType
              }
            }
          })
        }}>
        {commentStateInfo && <p className={css(StateMessage)}>{commentStateInfo}</p>}
        <div className={css(CommentInput)}>
          <RichTextBlock
            value={commentInput}
            onChange={input => {
              setCommentInput(input)
            }}
          />
        </div>

        <BaseButton css={props.parentID ? SmallButton : CommentButton} disabled={loading}>
          {props.parentID ? 'Submit' : 'Post comment'}
        </BaseButton>
      </form>
    </div>
  )
}

export function CommentList(commentListProps: CommentListProps) {
  const css = useStyle()

  const [activeCommentID, setActiveCommentID] = useState('')
  const {comments} = commentListProps

  function toggleReplyForm(id: string) {
    activeCommentID === '' ? setActiveCommentID(id) : setActiveCommentID('')
  }

  function Comment(CommentProps: CommentProps) {
    const {
      id,
      state,
      rejectionReason,
      userName,
      authorType,
      modifiedAt,
      children,
      text,
      itemID,
      itemType
    } = CommentProps.comment

    // This allows to display the children in a chronological order for the sake of a better UX
    let childrenReversed = [...children].reverse()

    const [editMode, setEditMode] = useState(false)
    const [commentInput, setCommentInput] = useState<RichTextBlockValue>(createDefaultValue())

    // Feedback to user if comment is awaiting approval or needs improvements
    const [commentStateInfo, setCommentStateInfo] = useState('')

    const pendingApproval = 'Your comment has been submitted and is awaiting approval'
    const pendingUserChanges = `Your comment has been rejected because of ${rejectionReason}. Please edit your comment.`

    // Handling Comment Update
    const [updateComment, {loading}] = useMutation(UpdateComment, {
      refetchQueries: mutationResult => [{query: ArticleQuery, variables: {id: itemID}}]
    })

    useEffect(() => {
      if (state === 'pendingUserChanges') {
        setCommentStateInfo(pendingUserChanges)
      } else if (state === 'pendingApproval') {
        setCommentStateInfo(pendingApproval)
      }
    }, [])

    return (
      <div className={css(Thread)} key={id}>
        <div className={css(CommentBox)} id={id}>
          <a href={'#' + id} className={css(commentBorderLink)}>
            <span className={css(SrOnly)}>Jump to comment {id}</span>
          </a>
          <div className={css(CommentHeading)}>
            <div className={css(RightColumn)}>
              <h4 className={css(CommentAuthor)}>{userName}</h4>
              <p className={css(CommentMeta)}>
                <span>{authorType}</span> ·{' '}
                <span className={css(Timestamp)}>{new Date(modifiedAt).toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className={css(CommentBody)}>
            {editMode ? (
              <div className={css(EditCommentInput)}>
                <RichTextBlock value={commentInput} onChange={value => setCommentInput(value)} />
              </div>
            ) : (
              <RichTextBlock
                disabled
                displayOnly
                value={text}
                onChange={() => {
                  /* do nothing */
                }}
              />
            )}
            <div className={css(Actions)}>
              {state === 'approved' ? (
                <button className={css(SmallButton)} onClick={() => toggleReplyForm(id)}>
                  Reply
                </button>
              ) : null}
              {state === 'pendingApproval' ? (
                <span className={css(PendingApproval)}>{commentStateInfo}</span>
              ) : state === 'pendingUserChanges' ? (
                <>
                  <button
                    className={css(SmallButton)}
                    disabled={loading}
                    onClick={() => {
                      if (editMode === true) {
                        updateComment({
                          variables: {
                            input: {
                              id,
                              text: commentInput
                            }
                          }
                        })
                      } else {
                        setCommentInput(text)
                      }
                      setEditMode(!editMode)
                    }}>
                    {editMode ? 'Save' : 'Edit'}
                  </button>
                  <p className={css(PendingApproval)}>{commentStateInfo}</p>
                </>
              ) : null}
            </div>
          </div>

          {activeCommentID === id ? (
            <ComposeComment itemID={itemID} itemType={itemType} role={'reply'} parentID={id} />
          ) : (
            ''
          )}
          {childrenReversed &&
            childrenReversed.map((child: Comment) => <ChildComment key={child.id} value={child} />)}
        </div>
      </div>
    )
  }

  function ChildComment(value: any) {
    const {id, rejectionReason, state, user, authorType, modifiedAt, text} = value.value

    const pendingUserChanges = `Your comment has been rejected because of ${rejectionReason}. Please edit your comment.`

    return (
      <div className={css(CommentBox, Replies)} id={id}>
        <a href={'#' + id} className={css(commentBorderLink)}>
          <span className={css(SrOnly)}>Jump to comment {id}</span>
        </a>
        <div className={css(CommentHeading)}>
          <div className={css(RightColumn)}>
            <h4 className={css(CommentAuthor)}>{user.name}</h4>
            <p className={css(CommentMeta)}>
              <span>{authorType}</span> ·{' '}
              <span className={css(Timestamp)}>{new Date(modifiedAt).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className={css(CommentBody)}>
          <RichTextBlock
            disabled
            displayOnly
            value={text}
            onChange={() => {
              /* do nothing */
            }}
          />
          <div className={css(Actions)}>
            {state === 'pendingApproval' ? (
              <span className={css(PendingApproval)}>
                Your comment has been submitted and is awaiting approval
              </span>
            ) : state === 'pendingUserChanges' ? (
              <>
                <button
                  className={css(SmallButton)}
                  onClick={() => alert('This function is not yet working')}>
                  Edit
                </button>
                <p className={css(PendingApproval)}>{pendingUserChanges}</p>
              </>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={css(Container, CommentBox)}>
      <h3 style={{marginTop: '2em'}}>Showing all comments</h3>
      {comments?.map((comment: Comment) => (
        <Comment comment={comment} key={comment.id} activeComment={activeCommentID} />
      ))}
    </div>
  )
}

export function LoginToComment(props: LoginToComment) {
  const {current} = useRoute()
  const {session} = useContext(AuthContext)
  const css = useStyle()

  return (
    <>
      {session && (
        <>
          <ComposeComment
            itemID={props.itemID}
            itemType={props.itemType}
            commentComposerHeader={'Compose a new comment'}
          />
          <p className={css(Container, StateMessage)}>
            Logged in as {session?.email}. <Link route={LogoutRoute.create({})}>Logout</Link>
          </p>
        </>
      )}
      {!session && (
        <p className={css(Container, StateMessage)}>
          Not logged in.{' '}
          {current && (
            <Link route={LoginRoute.create({}, {query: {next: current?.path}})}>Login</Link>
          )}{' '}
          to comment
        </p>
      )}
    </>
  )
}
