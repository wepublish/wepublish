import {readFileSync, writeFileSync} from 'fs'

const ARTICLES_PATH = new URL('../04-articles.json', import.meta.url).pathname
const OUTPUT_PATH = new URL('../05-articles.json', import.meta.url).pathname

const data = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))

let removedCount = 0

const fixedArticles = data.articles.map(article => {
    const authors = article.latest?.authors
    if (!authors || authors.length < 2) {
        return article
    }

    const deduped = []
    for (const author of authors) {
        const duplicate = deduped.find(a => a.name === author.name)
        if (duplicate) {
            removedCount++
            if (author.slug.length < duplicate.slug.length) {
                deduped[deduped.indexOf(duplicate)] = author
            }
        } else {
            deduped.push(author)
        }
    }

    if (deduped.length === authors.length) {
        return article
    }

    return {...article, latest: {...article.latest, authors: deduped}}
})

const result = {...data, articles: fixedArticles}

writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 4))

console.log(`Removed ${removedCount} duplicate author(s)`)
console.log('Written to 05-articles.json')
