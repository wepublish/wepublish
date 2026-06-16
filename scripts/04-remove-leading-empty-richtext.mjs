import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../03-articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../04-articles.json', import.meta.url).pathname

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

let removedCount = 0

function isEmptyRichTextBlock(block) {
    return (
        block.__typename === 'RichTextBlock' &&
        block.richText?.length === 1 &&
        block.richText[0]?.type === 'paragraph' &&
        block.richText[0]?.children?.length === 1 &&
        block.richText[0]?.children[0]?.text === ''
    )
}

const fixedArticles = data.articles.map(article => {
    const blocks = article.latest?.blocks
    if (!blocks || blocks.length < 3) {
        return article
    }

    if (
        blocks[0].__typename === 'TitleBlock' &&
        blocks[1].__typename === 'ImageBlock' &&
        isEmptyRichTextBlock(blocks[2])
    ) {
        removedCount++
        return {
            ...article,
            latest: {
                ...article.latest,
                blocks: [blocks[0], blocks[1], ...blocks.slice(3)]
            }
        }
    }

    return article
})

const result = {...data, articles: fixedArticles}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))

console.log(`Removed leading empty RichTextBlock from ${removedCount} article(s)`)
console.log('Written to 04-articles.json')
