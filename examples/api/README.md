# Api Examples

The api is published via https://www.npmjs.com/package/@wepublish/api.
Source files are published from [/packages/api](https://github.com/wepublish/wepublish/tree/master/packages/api) .
We use lerna to keep all realeses and npm versions equal in this mono repo.

From v0.8.4 on, releases are coming with github tags, for more see https://github.com/wepublish/wepublish/tags 


## Example requests

`<API_BASE_URL>` is a placeholder for your GraphQL playground url, e.g.  

#### Getting an article via `<API_BASE_URL>` enpoint

Therefor you ll need a payload and set the var `id` via query params, see below.

**Payload**:
```
query article($id: ID!) {
  article(id: $id) {id, slug, title, preTitle}
}
```

**Query Vars**:
```
{"id": "eEKeGgtBFF" }
```



#### Getting an article via `<API_BASE_URL>/admin` endpoint

Therefor you ll need a payload, set vars via query params and an authorization header, see below.


**Payload**:
```
query Article($id: ID!) {
  article(id: $id) {
    id
    shared

    pending {
      publishAt
    }

    published {
      publishedAt
      updatedAt
    }
    latest {
      publishedAt
      updatedAt
      revision
      slug
      preTitle
      title
      lead
      tags
      breaking
    }
  }
}
```

**Query Vars**:

```
{"id": "eEKeGgtBFF" }
```

**Headers**:

```
{
  "Authorization": "Bearer <YOUR-SESSION-ID-AFTER-LOGIN>"
}
```
