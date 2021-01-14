import {cssRule, useStyle} from '@karma.run/react'
import React from 'react'
import {Image} from '../atoms/image'
import {PrimaryButton} from '../atoms/primaryButton'
import {Color} from '../style/colors'

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

const Flex = cssRule(() => ({
  display: 'flex'
}))

const RightColumn = cssRule(() => ({
  paddingLeft: '1.2em'
}))

const CommentAuthor = cssRule(() => ({
  margin: 0
}))

const CommentMeta = cssRule(() => ({
  fontSize: '0.8em',
  margin: '0 0 1em 0'
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

export function CommentList() {
  const css = useStyle()
  return (
    <div className={css(Container, CommentBox)}>
      <h3>Alle Kommentare</h3>
      <div className={css(Flex)}>
        <div className="leftColumn" style={{width: 80}}>
          <Image src={'../../../static/icons/avatar.jpg'} />
        </div>
        <div className={css(RightColumn)}>
          <h4 className={css(CommentAuthor)}>Name</h4>
          <p className={css(CommentMeta)}>
            <span>Moderatör</span> · <span className={css(Timestamp)}>14.01.2021 12:56</span>
          </p>
          <div className="commentBody">
            Text Text Text Text Text Text Text Text Text Text Text Text Text Text Text Text{' '}
          </div>
        </div>
      </div>
    </div>
  )
}
