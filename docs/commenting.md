# Setup Commenting

## Getting Started

First step is to add the required GraphQL queries and mutations to your website, We will be using `@apollo/client`

## Initialize - API Communication

**NOTE**
Only follow this part if you haven't implemented graphQL queries yet

---

We use GraphQL API for communication, we will add Apollo Client SDK

```bash
npm install @apollo/client
```

and then add a directory for GraphQL queries and mutations as `src/api` with a file under it called comments.ts

## Initialize - GraphQL queries and mutations

update the article fragment being used in its query to have comments as well like:

```
fragment ArticleData on Article {
    comments {
      ...CommentsData
      ...RecursiveCommentsData
    }
}
```

and define CommentsData fragment as:

```
  fragment CommentsData on Comment {
    id
    state
    rejectionReason
    itemID
    itemType
    text
    modifiedAt
    parentID
    authorType
    user {
      id
      name
      preferredName
    }
  }
```

and the comments' replies fragment as:

```
  fragment RecursiveCommentsData on Comment {
    children {
      ...CommentsData
    }
  }
```

## Initialize - Article/Page template

Now when you call your article query, you will be able to get: - All of the approved comments. - If the user logged in, you will get any comments submitted by the current user of any status

```
const {data, loading, error} = useQuery(ArticleQuery, {variables})

```

And map on comments list and render them

```
{comments?.map((comment) => (
    <Comment
        key={comment.id}
        comment={comment}
        activeComment={activeCommentID}
    />
))}
```

where `Comment` component will look something like:

```
<TO BE ADDED>
```
