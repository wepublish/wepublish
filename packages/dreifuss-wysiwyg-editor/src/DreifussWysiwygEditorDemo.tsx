import React from 'react'
import {render} from 'react-dom'
import DreifussWysiwygEditor from './DreifussWysiwygEditor'
import {ELEMENT_H1, ELEMENT_H2, ELEMENT_H3} from '@udecode/slate-plugins'

const wePublishCurrentValue: any = [
  {
    type: 'heading-one',
    children: [
      {
        text: 'HHH1'
      }
    ]
  },
  {
    type: 'heading-two',
    children: [
      {
        text: 'HHH2'
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'HHH3',
        bold: true
      }
    ]
  }
]

const richTextAdapter = (val: any) => {
  const elementTypeMatcher = (type: any) => {
    switch (type) {
      case 'heading-one':
        return ELEMENT_H1
      case 'heading-two':
        return ELEMENT_H2
      case 'heading-three':
        return ELEMENT_H3
      default:
        return 'paragraph'
    }
  }
  if (val.length) return val.map((one: any) => ({...one, type: elementTypeMatcher(one.type)}))
}

const DreifussWysiwygEditorDemo = () => (
  <div>
    <h1>React Component Demo</h1>
    <DreifussWysiwygEditor initialValue={richTextAdapter(wePublishCurrentValue)} />
  </div>
)

render(<DreifussWysiwygEditorDemo />, document.getElementById('root'))
