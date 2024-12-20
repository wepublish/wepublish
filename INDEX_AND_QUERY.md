Plan without index: https://explain.dalibo.com/plan/ah9440b3hd5ca61f

Plan with index: https://explain.dalibo.com/plan/e49hd132b0319bgf

```sql
EXPLAIN ANALYZE SELECT * FROM articles a
JOIN "articles.revisions" ar ON a."publishedId" = ar.id
WHERE to_tsvector('english', ar.title)
  || jsonb_to_tsvector('english', jsonb_path_query_array(blocks, 'strict $.**.text'), '["string"]')
  @@ to_tsquery('english', 'labore & perferendis');
```
