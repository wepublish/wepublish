# GraphQL Schema

```graphql
type Article {
  id: ID!
  title: String!
  lead: String!
  peer: Peer @relation(name: "Peer")
}

type Peer {
  id: ID!
  name: string
  url: string
}
```
