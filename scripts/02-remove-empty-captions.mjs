import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../01-articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../02-articles.json', import.meta.url).pathname

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

let removedEmptyCaptions = 0

const fixedArticles = data.articles.map(article => {
  if (!article.latest?.blocks) {
    return article
  }

  const fixedBlocks = article.latest.blocks.map(block => {
    if (block.caption === '()') {
      removedEmptyCaptions++
      return {...block, caption: ''}
    }
    return block
  })

  return {...article, latest: {...article.latest, blocks: fixedBlocks}}
})

const result = {...data, articles: fixedArticles}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))

console.log(`Replaced empty captions "()" in ${removedEmptyCaptions} blocks`)
console.log('Written to 02-articles.json')
