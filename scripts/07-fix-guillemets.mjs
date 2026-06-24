import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../06-articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../07-articles.json', import.meta.url).pathname

const DRY_RUN = process.argv.includes('--dry-run')

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

const OPENING = '«'
const CLOSING = '»'

let fixedGuillemets = 0

// Characters that may legitimately sit directly before an opening guillemet
// (whitespace handled separately).
const BEFORE_OPENING = new Set(['(', '[', '{', '‚', '„', '–', '—', '/'])
// Characters that may legitimately sit directly after a closing guillemet.
const AFTER_CLOSING = new Set(['.', ',', ';', ':', '!', '?', ')', ']', '}', '…', '–', '—', '/'])

function isSpace(char) {
  return char === undefined || /\s/.test(char)
}

function isBeforeBoundary(char) {
  return isSpace(char) || BEFORE_OPENING.has(char)
}

function isAfterBoundary(char) {
  return isSpace(char) || AFTER_CLOSING.has(char)
}

// Collect every text node within a block node, in reading order, so that a
// guillemet split away from its surrounding text by markup (bold, links, …)
// is still evaluated against its true neighbouring characters.
function collectTextNodes(node, acc) {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectTextNodes(child, acc)
    }
    return
  }
  if (node && typeof node === 'object') {
    if (typeof node.text === 'string') {
      acc.push(node)
    }
    if (Array.isArray(node.children)) {
      collectTextNodes(node.children, acc)
    }
  }
}

function fixBlockNode(node) {
  const textNodes = []
  collectTextNodes(node, textNodes)

  if (!textNodes.length) {
    return
  }

  // Flatten into a single character stream while remembering the origin of
  // every character, so corrections can be written back in place.
  const chars = []
  textNodes.forEach((textNode, nodeIndex) => {
    for (let i = 0; i < textNode.text.length; i++) {
      chars.push({char: textNode.text[i], nodeIndex, charIndex: i})
    }
  })

  const replacements = new Map() // nodeIndex -> array of corrected chars

  for (let i = 0; i < chars.length; i++) {
    const current = chars[i].char
    if (current !== OPENING && current !== CLOSING) {
      continue
    }

    const prev = chars[i - 1]?.char
    const next = chars[i + 1]?.char

    let expected
    if (isBeforeBoundary(prev) && !isSpace(next)) {
      expected = OPENING
    } else if (!isSpace(prev) && isAfterBoundary(next)) {
      expected = CLOSING
    } else {
      // Ambiguous (e.g. surrounded by non-space on both sides) — leave as is.
      continue
    }

    if (expected !== current) {
      fixedGuillemets++

      if (DRY_RUN) {
        const before = chars.slice(Math.max(0, i - 40), i).map(c => c.char).join('')
        const after = chars.slice(i + 1, i + 41).map(c => c.char).join('')
        console.log(`…${before}[${current}→${expected}]${after}…`)
        continue
      }

      const {nodeIndex, charIndex} = chars[i]
      if (!replacements.has(nodeIndex)) {
        replacements.set(nodeIndex, [...textNodes[nodeIndex].text])
      }
      replacements.get(nodeIndex)[charIndex] = expected
    }
  }

  for (const [nodeIndex, charArray] of replacements) {
    textNodes[nodeIndex].text = charArray.join('')
  }
}

function fixRichText(richText) {
  if (!Array.isArray(richText)) {
    return richText
  }
  for (const node of richText) {
    fixBlockNode(node)
  }
  return richText
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

if (DRY_RUN) {
  console.log(`\nWould fix ${fixedGuillemets} inverted guillemets (dry run, nothing written)`)
} else {
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))
  console.log(`Fixed ${fixedGuillemets} inverted guillemets`)
  console.log('Written to 07-articles.json')
}
