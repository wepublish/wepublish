import React, {ReactNode, Fragment} from 'react'
import {Node} from 'slate'

export interface RichTextProps {
  readonly value: Node[]
}

export function RichText(props: RichTextProps) {
  return <div>{renderNodes(props.value)}</div>
}

export function renderNodes(nodes: Node[]): ReactNode {
  return nodes.map((node, index) => {
    if (node.children) {
      switch (node.type) {
        case 'heading-one':
          return <h1 key={index}>{renderNodes(node.children)}</h1>

        case 'heading-two':
          return <h2 key={index}>{renderNodes(node.children)}</h2>

        case 'heading-three':
          return <h3 key={index}>{renderNodes(node.children)}</h3>

        case 'bulleted-list':
          return <ul key={index}>{renderNodes(node.children)}</ul>

        case 'numbered-list':
          return <ol key={index}>{renderNodes(node.children)}</ol>

        case 'list-item':
          return <li key={index}>{renderNodes(node.children)}</li>

        case 'link':
          return (
            <a key={index} target="_blank" rel="noopener" href={node.url} title={node.title}>
              {renderNodes(node.children)}
            </a>
          )

        default:
          return <p key={index}>{renderNodes(node.children)}</p>
      }
    } else {
      const splitText: string[] = node.text.split('\n')

      let element = (
        <>
          {splitText.length > 1
            ? splitText.map((text, index) => (
                <Fragment key={index}>
                  {text}
                  {index !== splitText.length - 1 ? <br /> : null}
                </Fragment>
              ))
            : splitText}
        </>
      )

      if (node.bold) {
        element = <strong>{element}</strong>
      }

      if (node.italic) {
        element = <em>{element}</em>
      }

      if (node.underline) {
        element = <u>{element}</u>
      }

      if (node.strikethrough) {
        element = <del>{element}</del>
      }

      return <React.Fragment key={index}>{element}</React.Fragment>
    }
  })
}
