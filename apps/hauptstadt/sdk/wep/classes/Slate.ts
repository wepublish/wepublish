import escapeHtml from 'escape-html'

type SlateNodeTypes =
  | 'heading-one'
  | 'heading-two'
  | 'heading-three'
  | 'paragraph'
  | 'link'
  | 'unordered-list'
  | 'ordered-list'
  | 'list-item'
  | 'table'
  | 'table-row'
  | 'table-cell'
export interface SlateNode {
  children?: SlateNode[]
  text?: string
  type?: SlateNodeTypes
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  superscript?: boolean
  subscript?: boolean
  url?: string
}

export default class Slate {
  private readonly fontClassHeadings: string

  constructor({fontClassHeadings}: {fontClassHeadings: string}) {
    this.fontClassHeadings = fontClassHeadings
  }

  /**
   * Entry point to parse slate json to html string
   * @param nodes
   * @return {*}
   */
  public toHtml(nodes: SlateNode[]): string {
    return nodes.map(node => this.parseRecursive(node)).join('')
  }

  /**
   * Entry point to parse slate json to string (e.g. to pass text content with line break into simple html textarea)
   * @param nodes
   */
  public toString(nodes: SlateNode[]): string {
    return nodes.map(node => this.parseRecursive(node, true)).join('')
  }

  /**
   * Parse simple text to Slate format
   * @param text
   */
  public textToSlate(text: string): SlateNode[] {
    const textLines = text.split('\n')
    const slateNodes: SlateNode[] = []
    for (const textLine of textLines) {
      const slateNode: SlateNode = {
        type: 'paragraph',
        children: [
          {
            text: textLine
          }
        ]
      }
      slateNodes.push(slateNode)
    }
    return slateNodes
  }

  /**
   * Recursive function to parse slate. See: https://docs.slatejs.org/concepts/10-serializing#html
   * @param node
   * @param textMode
   * @return {string|*}
   */
  private parseRecursive(node: SlateNode, textMode = false): string {
    if (node.text) {
      const string = escapeHtml(node.text)
      if (textMode) {
        return string
      }
      return this.decorateHtml(node, string)
    }
    if (!node.children) {
      return ''
    }
    const children = node.children.map((n: SlateNode) => this.parseRecursive(n)).join('')
    if (textMode) {
      return `${children} \n`
    }
    return this.decorateCustomHtml(node, children)
  }

  private decorateCustomHtml(node: SlateNode, children: string): string {
    switch (node.type) {
      case 'heading-one':
        return `<div class="title-30 py-7 ${this.fontClassHeadings} zoomable-text">${children}</div>`
      case 'heading-two':
        return `<div class="title-24 py-5 ${this.fontClassHeadings} zoomable-text">${children}</div>`
      case 'heading-three':
        return `<div class="title-22 py-4 ${this.fontClassHeadings} zoomable-text">${children}</div>`
      case 'paragraph':
        return `<p>${children}</p>`
      case 'link':
        // workaround until fixed: https://github.com/wepublish/wepublish/issues/527
        return `<a href="${node?.url?.replace(
          'mailto://',
          'mailto:'
        )}" target="_blank" class="zoomable-text">${children}</a>`
      case 'unordered-list':
        return `<ul>${children}</ul>`
      case 'ordered-list':
        return `<ol>${children}</ol>`
      case 'list-item':
        return `<li class="pb-3">${children}</li>`
      case 'table':
        return `<table class="w-100 border">${children}</table>`
      case 'table-row':
        return `<tr>${children}</tr>`
      case 'table-cell':
        return `<td class="zoomable-text">${children}</td>`
      default:
        return children
    }
  }

  private decorateHtml(node: SlateNode, string: string): string {
    if (node.bold) {
      string = `<strong class="slate-strong">${string}</strong>`
    }
    if (node.italic) {
      string = `<i>${string}</i>`
    }
    if (node.underline) {
      string = `<u>${string}</u>`
    }
    if (node.strikethrough) {
      string = `<s>${string}</s>`
    }
    if (node.superscript) {
      string = `<sup>${string}</sup>`
    }
    if (node.subscript) {
      string = `<sub>${string}</sub>`
    }
    return string
  }
}
