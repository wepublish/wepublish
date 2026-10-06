// GraphQL documents of the live neuewege.ch site, copied verbatim from its
// bundle (see reference/live-graphql-documents.graphql). The aliases
// (subtitle: fieldTitle, text: fieldText, ...) are what the ported
// components expect as props - do not rename them.
import { gql } from '@apollo/client';

const ImageFragment = gql`
  fragment ImageFragment on MediaImage {
    uuid
    caption: fieldCaption {
      format
      processed
    }
    image: fieldMediaImage {
      alt
      style_s: derivative(style: DEFAULTS) {
        width
        url
      }
      style_m: derivative(style: DEFAULTM) {
        width
        url
      }
      style_l: derivative(style: DEFAULTL) {
        width
        url
      }
      style_xl: derivative(style: DEFAULTXL) {
        width
        url
      }
      style_xxl: derivative(style: DEFAULTXXL) {
        width
        url
      }
      style_xxxl: derivative(style: DEFAULTXXXL) {
        width
        height
        url
      }
    }
  }
`;

const DownloadsFragment = gql`
  fragment DownloadsFragment on ParagraphDownloads {
    downloads: fieldDownloads {
      download: entity {
        uuid: entityUuid
        name
        ... on MediaFile {
          fieldMediaFile {
            entity {
              url
            }
          }
        }
      }
    }
  }
`;

const WebformFragment = gql`
  fragment WebformFragment on ParagraphWebform {
    fieldWebform {
      id: targetId
    }
  }
`;

const ParagraphFragments = gql`
  fragment TitelFragment on ParagraphTitle {
    subtitle: fieldTitle
  }

  fragment TextFragment on ParagraphText {
    text: fieldText {
      format
      processed
    }
  }

  fragment QuoteFragment on ParagraphQuote {
    quote: fieldQuote
  }

  fragment FootnotesFragment on ParagraphFootnotes {
    footnotesArray: fieldFootnoteList {
      footnote: entity {
        ... on ParagraphFootnote {
          uuid: entityUuid
          text: fieldFootnote {
            format
            processed
          }
        }
      }
    }
  }

  fragment QuestionFragment on ParagraphInterviewQuestion {
    text: fieldText {
      processed
    }
  }

  fragment InfoFragment on ParagraphInfo {
    text: fieldText {
      processed
    }
  }

  fragment ImagesFragment on ParagraphImages {
    imagesArray: fieldImages {
      entity {
        ...ImageFragment
      }
    }
  }

  fragment TwoColumnFragment on Paragraph2Column {
    firstColumn: fieldFirstColumn {
      paragraph: entity {
        key: entityUuid
        ...TextFragment
        ...TitelFragment
        ...DownloadsFragment
      }
    }
    secondColumn: fieldSecondColumn {
      paragraph: entity {
        key: entityUuid
        ...TextFragment
        ...TitelFragment
        ...DownloadsFragment
      }
    }
  }
  ${ImageFragment}
  ${DownloadsFragment}
`;

const ArticleTeaserFragment = gql`
  fragment ArticleTeaserFragment on NodeArticle {
    uuid: entityUuid
    title
    url: entityUrl {
      path
    }
    teaser_text: fieldTeaserText
    teaser_image: fieldTeaserImage {
      entity {
        ...ImageFragment
      }
    }
    date: fieldDate {
      value
    }
    authors: fieldAuthors {
      ... on FieldNodeArticleFieldAuthors {
        author: entity {
          firstname: fieldFirstName
          lastname: fieldLastName
          mail
        }
      }
    }
    tags: fieldTags {
      ... on FieldNodeArticleFieldTags {
        entity {
          uuid: entityUuid
          label: entityLabel
          url: entityUrl {
            path
          }
        }
      }
    }
  }
  ${ImageFragment}
`;

const AuthorBioFragment = gql`
  fragment AuthorBioFragment on FieldNodeArticleFieldAuthors {
    author: entity {
      mail: userMail
      firstname: fieldFirstName
      lastname: fieldLastName
      bio: fieldText {
        processed
      }
      links: fieldLinks {
        uri
        title
      }
    }
  }
`;

// the paragraph selection is shared by pages, articles and events
const paragraphsSelection = `
  paragraphs: fieldBody {
    paragraph: entity {
      key: entityUuid
      ...TextFragment
      ...TitelFragment
      ...QuoteFragment
      ...FootnotesFragment
      ...ImagesFragment
      ...TwoColumnFragment
      ...WebformFragment
      ...QuestionFragment
      ...InfoFragment
      ...DownloadsFragment
    }
  }
`;

const PageFragment = gql`
  fragment PageFragment on NodePage {
    pageType: entityBundle
    title: entityLabel
    ${paragraphsSelection}
  }
`;

const ArticleFragment = gql`
  fragment ArticleFragment on NodeArticle {
    tags: fieldTags {
      entity {
        label: entityLabel
        url: entityUrl {
          path
          routed
        }
      }
    }
    socialMediaImage: fieldSocialMediaImage {
      entity {
        ... on MediaFile {
          fieldMediaFile {
            entity {
              url
            }
          }
        }
      }
    }
    pageType: entityBundle
    url: entityUrl {
      path
    }
    title: entityLabel
    authors: fieldAuthors {
      entity {
        uuid
      }
      ...AuthorBioFragment
    }
    date: fieldDate {
      value
    }
    publication: fieldPublication
    lead: fieldLead
    ${paragraphsSelection}
    relatedArticles {
      ...ArticleTeaserFragment
    }
  }
  ${AuthorBioFragment}
  ${ArticleTeaserFragment}
`;

const EventFragment = gql`
  fragment EventFragment on NodeEvent {
    key: uuid
    title: entityLabel
    ${paragraphsSelection}
  }
`;

const EventTeaserFragment = gql`
  fragment EventTeaserFragment on NodeEvent {
    key: uuid
    title: entityLabel
    date: fieldDate {
      value
    }
  }
`;

export const RouterQuery = gql`
  query RouterQuery($path: String!) {
    route(path: $path) {
      ... on EntityCanonicalUrl {
        entity {
          ...PageFragment
          ...ArticleFragment
          ...EventFragment
        }
      }
    }
  }
  ${PageFragment}
  ${ArticleFragment}
  ${EventFragment}
  ${ParagraphFragments}
  ${WebformFragment}
`;

export const SearchApiQuery = gql`
  query searchApiQuery($queryString: String, $offset: Int!, $limit: Int!) {
    searchIndexView(
      page: $offset
      pageSize: $limit
      filter: { search_api_fulltext: $queryString }
    ) {
      count
      entities: results {
        id: entityId
        ...ArticleTeaserFragment
      }
    }
  }
  ${ArticleTeaserFragment}
`;

export const PagerQuery = gql`
  query PagerQuery($queryString: String, $page: Int, $pageSize: Int) {
    searchIndexView: pagerSearchIndexView(
      page: $page
      pageSize: $pageSize
      filter: { search_api_fulltext: $queryString }
    ) {
      count
      results {
        entityUrl {
          path
          routed
        }
      }
    }
  }
`;

export const AgendaTeaserQuery = gql`
  query AgendaTeaserQuery($offset: Int!, $limit: Int!) {
    agenda: agendaTeaserView(page: $offset, pageSize: $limit) {
      events: results {
        ...EventTeaserFragment
      }
    }
  }
  ${EventTeaserFragment}
`;

export const AgendaQuery = gql`
  query AgendaQuery($offset: Int!, $limit: Int!) {
    agenda: agendaView(page: $offset, pageSize: $limit) {
      events: results {
        ...EventFragment
      }
    }
  }
  ${EventFragment}
  ${ParagraphFragments}
  ${WebformFragment}
`;

export const MainMenuQuery = gql`
  query MainMenuQuery($name: String!) {
    menu: menuByName(name: $name) {
      links {
        expanded
        description
        label
        url {
          path
          routed
        }
      }
    }
  }
`;

export const FrontPopupQuery = gql`
  query FrontPopup {
    collection: blockContentQuery(
      limit: 1
      filter: {
        conditions: { field: "type", value: "popup_front", operator: EQUAL }
      }
    ) {
      entities {
        entityId
        entityLabel
        ... on BlockContentPopupFront {
          fieldText {
            value
            format
            processed
          }
        }
      }
    }
  }
`;

export const ArticlePopupQuery = gql`
  query ArticlePopup {
    collection: blockContentQuery(
      limit: 1
      filter: {
        conditions: { field: "type", value: "popup_article", operator: EQUAL }
      }
    ) {
      entities {
        entityId
        entityLabel
        ... on BlockContentPopupArticle {
          fieldText {
            value
            format
            processed
          }
        }
      }
    }
  }
`;
