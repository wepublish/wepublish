import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../05-articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../06-articles.json', import.meta.url).pathname

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

let removedCount = 0

function isAuthorLeadLink(node) {
    return (
        node.type === 'link' &&
        node.children?.length === 1 &&
        typeof node.children[0]?.text === 'string' &&
        node.children[0].text.trim().startsWith('Von ')
    )
}

function stripAuthorLeadFromParagraph(node) {
    if (node.type !== 'paragraph' || !node.children?.length) {
        return node
    }
    if (!isAuthorLeadLink(node.children[0])) {
        return node
    }
    removedCount++
    let start = 1
    while (start < node.children.length && node.children[start]?.text === '\n') {
        start++
    }
    const remaining = node.children.slice(start)
    if (remaining.length === 0) {
        return null
    }
    return {...node, children: remaining}
}

function removeAuthorLeads(nodes) {
    const result = []
    for (const node of nodes) {
        const stripped = stripAuthorLeadFromParagraph(node)
        if (stripped === null) {
            continue
        }
        if (stripped !== node) {
            result.push(stripped)
            continue
        }
        if (node.children) {
            const fixedChildren = removeAuthorLeads(node.children)
            result.push(fixedChildren === node.children ? node : {...node, children: fixedChildren})
        } else {
            result.push(node)
        }
    }
    return result.length === nodes.length && result.every((n, i) => n === nodes[i]) ? nodes : result
}

const fixedArticles = data.articles.map(article => {
    const blocks = article.latest?.blocks
    if (!blocks) {
        return article
    }

    const fixedBlocks = blocks.map(block => {
        if (block.__typename !== 'RichTextBlock' || !block.richText) {
            return block
        }

        const fixedRichText = removeAuthorLeads(block.richText)
        if (fixedRichText === block.richText) {
            return block
        }

        return {...block, richText: fixedRichText}
    })

    if (fixedBlocks.every((b, i) => b === blocks[i])) {
        return article
    }

    return {...article, latest: {...article.latest, blocks: fixedBlocks}}
})

const result = {...data, articles: fixedArticles}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))

console.log(`Removed ${removedCount} author lead paragraph(s)`)
console.log('Written to 06-articles.json')
