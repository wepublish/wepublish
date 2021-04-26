import React from 'react'
import {render} from 'react-dom'
import WysiwygEditor from './WysiwygEditor'

const WysiwygEditorDemo = () => (
  <div>
    <h1>React Component Demo</h1>
    <WysiwygEditor title="Hello" />
  </div>
)

render(<WysiwygEditorDemo />, document.getElementById('root'))
