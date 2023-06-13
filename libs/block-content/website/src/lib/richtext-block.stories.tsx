import {Meta} from '@storybook/react'
import {RichTextBlock} from './richtext-block'
import {css} from '@emotion/react'

export default {
  component: RichTextBlock,
  title: 'Blocks/Richtext'
} as Meta

const richText = [
  {
    type: 'heading-one',
    children: [
      {
        text: 'Title'
      }
    ]
  },
  {
    type: 'heading-two',
    children: [
      {
        text: 'Title 2'
      }
    ]
  },
  {
    type: 'heading-three',
    children: [
      {
        text: 'Title 3'
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
            text: 'Unordered List'
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
            text: 'Ordered List'
          }
        ]
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
  },
  {
    type: 'table',
    children: [
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Table Cell 1'
                  }
                ]
              }
            ],
            borderColor: '#000000'
          },
          {
            type: 'table-cell',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Table Cell 2'
                  }
                ]
              }
            ],
            borderColor: '#000000'
          }
        ]
      },
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Table Cell 3'
                  }
                ]
              }
            ],
            borderColor: '#000000'
          },
          {
            type: 'table-cell',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Table Cell 4'
                  }
                ]
              }
            ],
            borderColor: '#000000'
          }
        ]
      }
    ]
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Normal text,'
      },
      {
        bold: true,
        text: ' Bold'
      },
      {
        text: ', '
      },
      {
        text: 'Italic',
        italic: true
      },
      {
        text: ', '
      },
      {
        text: 'Underline',
        underline: true
      },
      {
        text: ', '
      },
      {
        text: 'Strikethrough',
        strikethrough: true
      },
      {
        text: ', '
      },
      {
        text: 'Sup',
        superscript: true
      },
      {
        text: ', '
      },
      {
        text: 'Sub',
        subscript: true
      },
      {
        text: ', '
      },
      {
        url: 'https://google.com',
        type: 'link',
        title: 'Link',
        children: [
          {
            text: 'Link'
          }
        ]
      },
      {
        text: ', 😀'
      }
    ]
  }
]

export const Default = {
  args: {
    richText
  }
}

export const WithClassName = {
  args: {
    richText,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    richText,
    css: css`
      background-color: #eee;
    `
  }
}
