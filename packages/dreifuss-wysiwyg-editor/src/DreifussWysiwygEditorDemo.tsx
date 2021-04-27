import React from 'react'
import {render} from 'react-dom'
import DreifussWysiwygEditor from './DreifussWysiwygEditor'

const DreifussWysiwygEditorDemo = () => (
  <div>
    <h1>React Component Demo</h1>
    <DreifussWysiwygEditor title="Hello" />
  </div>
)

render(<DreifussWysiwygEditorDemo />, document.getElementById('root'))
