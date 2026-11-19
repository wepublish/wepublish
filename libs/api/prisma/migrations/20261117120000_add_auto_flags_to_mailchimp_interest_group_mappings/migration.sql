-- Interest group mappings gained autoAdd/autoRemove. Turn both on for every
-- existing mapping so they keep syncing as before; flags already set win.
UPDATE "settings.syncprovider"
SET "mailchimp_interestGroupMappings" = (
  SELECT jsonb_agg('{"autoAdd": true, "autoRemove": true}'::jsonb || mapping ORDER BY position)
  FROM jsonb_array_elements("mailchimp_interestGroupMappings") WITH ORDINALITY AS t(mapping, position)
)
WHERE jsonb_typeof("mailchimp_interestGroupMappings") = 'array'
  AND "mailchimp_interestGroupMappings" <> '[]'::jsonb;
