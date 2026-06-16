import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../02-articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../03-articles.json', import.meta.url).pathname

const OLD_AUTHOR_ID = 'cmncvwib9000j01yimjvv25i9'

const NEW_AUTHOR = {
    id: 'cm8b1jqjx005fl107k7v4gxvi',
    name: 'Redaktion OnlineReports',
    slug: 'redaktion-onlinereports',
    url: 'https://review02.wepublish.works/author/redaktion-onlinereports'
}

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

let replacedCount = 0

const fixedArticles = data.articles.map(article => {
    if (!article.latest?.authors) {
        return article
    }

    const fixedAuthors = article.latest.authors.map(author => {
        if (author.id === OLD_AUTHOR_ID) {
            replacedCount++
            return NEW_AUTHOR
        }
        return author
    })

    return {...article, latest: {...article.latest, authors: fixedAuthors}}
})

const result = {...data, articles: fixedArticles}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))

console.log(`Replaced author "OnlineReports-Redaktion" in ${replacedCount} article(s)`)
console.log('Written to 03-articles.json')
