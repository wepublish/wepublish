import {cssRule, useStyle} from '@karma.run/react'
import React, {useState} from 'react'
// import { createPortal } from 'react-dom'
import {Image} from '../atoms/image'
import {PrimaryButton} from '../atoms/primaryButton'
// import usePortal from '../atoms/usePortal'
import {Color} from '../style/colors'

interface Comments {
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

const comments: Comments[] = [
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
        text: 'I am angry',
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
        text: 'Sauron, please go and eat a Snickers',
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

const Container = cssRule(() => ({
  width: '400px',
  margin: '0 auto'
}))

const CommentBox = cssRule(() => ({
  marginBottom: '2em'
}))

const CommentInputField = cssRule(() => ({
  resize: 'none',
  padding: '0.5em'
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

const CommentRevisionMeta = cssRule(() => ({
  borderTop: `1px solid ${Color.Neutral}`,
  fontSize: '0.8em',
  margin: '1em 0 1em 0',
  paddingTop: '1em'
}))

const editState = cssRule(() => ({
  cursor: 'Pointer'
}))

const Flex = cssRule(() => ({
  display: 'flex'
}))

const RightColumn = cssRule(() => ({
  paddingLeft: '1.2em',
  width: '100%'
}))

const Timestamp = cssRule(() => ({
  color: Color.Neutral
}))

export function ComposeComment() {
  const css = useStyle()
  return (
    <div className={css(Container)}>
      <h3>Kommentar verfassen</h3>
      <form>
        <p>
          <textarea
            maxLength={1000}
            rows={4}
            cols={50}
            placeholder="Default Input"
            className={css(CommentInputField)}
          />
        </p>
        <p>
          <PrimaryButton text="Kommentar posten" />
        </p>
      </form>
    </div>
  )
}

function Comment(props: any) {
  const css = useStyle()

  const [showRevisions, setShowRevisions] = useState(false)

  const togglerTrueFalse = () => setShowRevisions(!showRevisions)

  return (
    <div className={css(Flex, CommentBox)} id={props.comment.id}>
      <div className="leftColumn" style={{width: 60}}>
        <Image src={'../../../static/icons/avatar.jpg'} />
      </div>
      <div className={css(RightColumn)}>
        <h4 className={css(CommentAuthor)}>{props.comment.userID}</h4>
        <p className={css(CommentMeta)}>
          <span>{props.comment.authorType}</span> ·{' '}
          <span className={css(Timestamp)}>{props.comment.modifiedAt.toLocaleString('de-DE')}</span>{' '}
          ·{' '}
          <span className={css(editState)} onClick={togglerTrueFalse}>
            {props.comment.revisions.length > 1 ? 'Edited' : ''}
          </span>
        </p>
        <p className={css(CommentBody)}>
          {props.comment.revisions.slice(props.comment.revisions.length - 1)[0].text}
        </p>
        {props.comment.revisions
          .slice(0, props.comment.revisions.length - 1)
          .reverse()
          .map((revision: GraphQLCommentRevision, index: number) => (
            <div
              style={{display: showRevisions ? 'block' : 'none'}}
              key={`comment${props.comment.id}-revision${index.toString()}`}>
              <p className={css(CommentRevisionMeta)}>
                <span className={css(Timestamp)}>{revision.createdAt.toLocaleString('de-DE')}</span>
              </p>
              <p className={css(CommentBody)}>{revision.text}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

export function CommentList() {
  const css = useStyle()

  return (
    <div className={css(Container, CommentBox)}>
      <h3>Alle Kommentare</h3>
      {comments.map(comment => (
        <Comment comment={comment} key={comment.id} />
      ))}
    </div>
  )
}
