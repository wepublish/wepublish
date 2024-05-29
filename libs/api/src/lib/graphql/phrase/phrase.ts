import {GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLInt} from 'graphql'
import {Context} from '../../context'
import {GraphQLPublicArticle} from '../article'
import {PublicArticle} from '../../db/article'
import {PublicPage} from '../../db/page'
import {GraphQLPublicPage} from '../page'
import {GraphQLPageInfo} from '../common'
import {ConnectionResult} from '../../db/common'

const GraphQLPhraseResultArticleContent = new GraphQLObjectType({
  name: 'PhraseResultArticleContent',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicArticle)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

const GraphQLPhraseResultPageContent = new GraphQLObjectType({
  name: 'PhraseResultPageContent',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicPage)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicPhrase = new GraphQLObjectType<
  {
    articles: ConnectionResult<PublicArticle>
    pages: ConnectionResult<PublicPage>
  },
  Context
>({
  name: 'Phrase',
  fields: {
    articles: {type: GraphQLPhraseResultArticleContent},
    pages: {type: GraphQLPhraseResultPageContent}
  }
})
