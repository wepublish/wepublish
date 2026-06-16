import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../01-articles.json', import.meta.url).pathname

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

let removedLeadingSpaces = 0

function fixChildren(children) {
  if (!Array.isArray(children)) {
    return children
  }

  const fixed = []
  for (const node of children) {
    if (typeof node.text === 'string' && node.text.startsWith(' ')) {
      removedLeadingSpaces++
      fixed.push({...node, text: node.text.replace(/^ +/, '')})
      continue
    }

    if (node.children) {
      fixed.push({...node, children: fixChildren(node.children)})
    } else {
      fixed.push(node)
    }
  }

  return fixed
}

function fixRichText(richText) {
  if (!Array.isArray(richText)) {
    return richText
  }
  return richText.map(node => {
    if (node.children) {
      return {...node, children: fixChildren(node.children)}
    }
    return node
  })
}

const fixedArticles = data.articles.map(article => {
  if (!article.latest?.blocks) {
    return article
  }

  const fixedBlocks = article.latest.blocks.map(block => {
    if (block.__typename !== 'RichTextBlock' || !block.richText) {
      return block
    }
    return {...block, richText: fixRichText(block.richText)}
  })

  return {...article, latest: {...article.latest, blocks: fixedBlocks}}
})

const result = {...data, articles: fixedArticles}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))

console.log(`Stripped leading spaces from ${removedLeadingSpaces} text nodes`)
console.log('Written to 01-articles.json')
