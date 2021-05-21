import React from 'react'
import {render} from 'react-dom'
import DreifussWysiwygEditor from './DreifussWysiwygEditor'
import {ELEMENT_H1, ELEMENT_H2, ELEMENT_H3} from '@udecode/slate-plugins'

// TODO: remove this
const wePublishCurrentValue: any = [
  {
    type: 'ordered-list',
    children: [
      {
        type: 'list-item',
        children: [
          {
            text: 'Numbered List: Insert a numbered list.'
          }
        ]
      },
      {
        type: 'paragraph',
        children: [
          {
            text: ''
          }
        ]
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        type: 'link',
        url: 'http://google.com',
        children: [
          {
            text: 'Links: Add links.'
          }
        ]
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        type: 'a',
        url: 'http://google.com',
        children: [
          {
            text: 'A link.'
          }
        ]
      }
    ]
    // title: 'Links: Add links.'
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Bold: Make the selected text bold.',
        bold: true
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Italic: Make the selected text italic.',
        italic: true
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Underline: Underline the selected text.',
        underline: true
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Strikethrough: Strikethrough the selected text.',
        strikethrough: true
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Subscript: Subscript the selected text.',
        superscript: true
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Superscript: Superscript the selected text.',
        subscript: true
      }
    ]
  },
  {
    type: 'heading-one',
    children: [
      {
        text: 'H1: Make the text a header with size H1. '
      }
    ]
  },
  {
    type: 'heading-two',
    children: [
      {
        text: 'H2: Make the text a header with size  H2.'
      }
    ]
  },
  {
    type: 'heading-three',
    children: [
      {
        text: 'H3: Make the text a header with size  H3.'
      }
    ]
  },
  {
    type: 'unordered-list',
    children: [
      {
        type: 'list-item',
        children: [
          {
            text: 'Bullet List: Insert a bullet list.'
          }
        ]
      }
    ]
  },
  {
    type: 'ordered-list',
    children: [
      {
        type: 'list-item',
        children: [
          {
            text: 'Numbered List: Insert a numbered list.'
          }
        ]
      }
    ]
  },
  {
    type: 'table',
    children: [
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            borderColor: '#000000',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: ''
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            borderColor: '#000000',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: ''
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Emojis: 😄'
      }
    ]
  }
]

// TODO: remove this after we work with the migration script
const richTextAdapter = (val: any) => {
  const elementTypeMatcher = (type: any) => {
    switch (type) {
      // *******************
      // HEADINGS
      case 'heading-one':
        return ELEMENT_H1
      case 'heading-two':
        return ELEMENT_H2
      case 'heading-three':
        return ELEMENT_H3

      // *******************
      // LISTS
      case 'ordered-list':
        return 'ol'
      case 'unordered-list':
        return 'ul'
      case 'list-item':
        return 'li'

      // *******************
      // TABLE
      case 'table':
        return 'table'
      case 'table-row':
        return 'tr'
      case 'table-cell':
        return 'td'
      case 'paragraph':
        return 'p'

      // *******************
      // LINKS
      case 'link':
        return 'a'

      // *******************
      default:
        return 'paragraph'
    }
  }

  if (val.length) {
    return val.map((element: any) => ({
      ...element,
      type: elementTypeMatcher(element.type),
      children: element.children?.length ? richTextAdapter(element.children) : element.children
    }))
  }
}

const DreifussWysiwygEditorDemo = () => (
  <div>
    <h1>React Component Demo</h1>
    <DreifussWysiwygEditor initialValue={richTextAdapter(wePublishCurrentValue)} showCharCount/>
  </div>
)

render(<DreifussWysiwygEditorDemo />, document.getElementById('root'))
