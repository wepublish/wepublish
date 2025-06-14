-- Copy the preTitle in the revision to the TitleBlock
UPDATE "articles.revisions"
SET blocks = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'type' = 'title' THEN
        elem || jsonb_build_object('preTitle', "preTitle"::text)
      ELSE
        elem
    END
  )
  FROM jsonb_array_elements(blocks) AS elem
)
WHERE blocks @> '[{"type": "title"}]';