import {jsx} from 'slate-hyperscript'

export class SlateDeserializer {
  run(content: string): any {
    const document = new DOMParser().parseFromString(content, 'text/html')
    const richText = this.deserialize(document.body)
    return richText
  }

  private deserialize(el: any, markAttributes = {}): any {
    if (el.nodeType === Node.TEXT_NODE) {
      return jsx('text', markAttributes, el.textContent)
    } else if (el.nodeType !== Node.ELEMENT_NODE) {
      return null
    }

    const nodeAttributes = {...markAttributes}

    // define attributes for text nodes
    switch (el.nodeName) {
      case 'STRONG':
        ;(nodeAttributes as any).bold = true
    }

    const children = Array.from(el.childNodes)
      .map(node => this.deserialize(node, nodeAttributes))
      .flat()

    if (children.length === 0) {
      //children.push(jsx('text', nodeAttributes, ''))
    }

    switch (el.nodeName) {
      case 'BODY':
        return jsx('fragment', {}, children)
      case 'BR':
        return '\n'
      case 'BLOCKQUOTE':
        return jsx('element', {type: 'quote'}, children)
      case 'P':
        return jsx('element', {type: 'paragraph'}, children)
      case 'A':
        return jsx('element', {type: 'link', url: el.getAttribute('href')}, children)
      default:
        return children
    }
  }
}
