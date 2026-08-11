-- Backfill the per-member-plan Mailchimp mappings introduced by
-- 20260717112102_add_mailchimp_mappings from the legacy expression-based
-- configuration in "settings.syncprovider".
--
-- Legacy shape:
--   mailchimp_mergeFieldMappings    [{"tag": "AKTIV", "expression": "slug:contains:abo"}]
--   mailchimp_interestGroupMappings [{"groupId": "abc123", "expression": "slug:equals:gonner"}]
--
-- Translation:
--   user.firstName                     -> settings.syncprovider.firstnameFields
--   user.name                          -> settings.syncprovider.lastnameFields
--   slug:equals|contains|contains_any  -> activeFieldIds of every matching member plan
--   active_abo                         -> activeFieldIds of every member plan
--   active_abo_with_payment:<m>:<d>    -> activeFieldIds of every member plan (see caveat below)
--   retarget:<days>                    -> retargetFieldIds of every member plan, retargetDelayDays = <days>
--   static:<value> / user.id           -> no equivalent, reported as a warning
--
-- `|` (OR) is supported: each branch is translated independently and the
-- results are unioned, which matches the old "first non-empty wins" semantics
-- because every branch resolves to the same tag.
--
-- Caveats, reported via RAISE WARNING so they show up in the deploy log:
--   * active_abo_with_payment loses its payment-method/window condition — it
--     degrades to a plain active flag.
--   * The legacy `retarget` and `active_abo` expressions were account-wide,
--     the new model is per member plan. A user holding plan A (active) and
--     plan B (expired) previously got "" for a retarget tag; now plan B
--     yields "1". Review the generated rows before the first sync run.
--   * Expressions matching no member plan produce no row at all.
--
-- Existing rows in "mailchimp_mappings" are never overwritten (ON CONFLICT DO
-- NOTHING), and the legacy columns are left in place so this can be re-derived.

-- Flatten the legacy merge field mappings into one row per (provider, tag, expression branch).
CREATE TEMPORARY TABLE _mc_backfill_merge_branch AS
SELECT
    sp.id                    AS provider_id,
    btrim(entry ->> 'tag')   AS tag,
    btrim(branch)            AS expr
FROM "settings.syncprovider" sp
CROSS JOIN LATERAL jsonb_array_elements(sp."mailchimp_mergeFieldMappings") AS entry
CROSS JOIN LATERAL unnest(string_to_array(entry ->> 'expression', '|')) AS branch
WHERE jsonb_typeof(sp."mailchimp_mergeFieldMappings") = 'array'
  AND jsonb_typeof(entry) = 'object'
  AND COALESCE(btrim(entry ->> 'tag'), '') <> ''
  AND COALESCE(btrim(branch), '') <> '';

-- Same for the legacy interest group mappings.
CREATE TEMPORARY TABLE _mc_backfill_interest_branch AS
SELECT
    sp.id                        AS provider_id,
    btrim(entry ->> 'groupId')   AS group_id,
    btrim(branch)                AS expr
FROM "settings.syncprovider" sp
CROSS JOIN LATERAL jsonb_array_elements(sp."mailchimp_interestGroupMappings") AS entry
CROSS JOIN LATERAL unnest(string_to_array(entry ->> 'expression', '|')) AS branch
WHERE jsonb_typeof(sp."mailchimp_interestGroupMappings") = 'array'
  AND jsonb_typeof(entry) = 'object'
  AND COALESCE(btrim(entry ->> 'groupId'), '') <> ''
  AND COALESCE(btrim(branch), '') <> '';

-- Resolve merge field branches to concrete member plans.
CREATE TEMPORARY TABLE _mc_backfill_merge_plan AS
-- slug:equals:<slug>
SELECT b.provider_id, b.tag, b.expr, mp.id AS member_plan_id, 'active'::text AS kind, NULL::integer AS days
FROM _mc_backfill_merge_branch b
JOIN "member.plans" mp ON mp.slug = btrim(substring(b.expr from '^slug:equals:(.*)$'))
WHERE b.expr ~ '^slug:equals:'
  AND btrim(substring(b.expr from '^slug:equals:(.*)$')) <> ''
UNION ALL
-- slug:contains:<needle>
SELECT b.provider_id, b.tag, b.expr, mp.id, 'active', NULL
FROM _mc_backfill_merge_branch b
CROSS JOIN "member.plans" mp
WHERE b.expr ~ '^slug:contains:'
  AND btrim(substring(b.expr from '^slug:contains:(.*)$')) <> ''
  AND position(btrim(substring(b.expr from '^slug:contains:(.*)$')) in mp.slug) > 0
UNION ALL
-- slug:contains_any:<needle>,<needle>
SELECT b.provider_id, b.tag, b.expr, mp.id, 'active', NULL
FROM _mc_backfill_merge_branch b
CROSS JOIN LATERAL unnest(string_to_array(substring(b.expr from '^slug:contains_any:(.*)$'), ',')) AS needle
CROSS JOIN "member.plans" mp
WHERE b.expr ~ '^slug:contains_any:'
  AND btrim(needle) <> ''
  AND position(btrim(needle) in mp.slug) > 0
UNION ALL
-- active_abo (account-wide -> every plan)
SELECT b.provider_id, b.tag, b.expr, mp.id, 'active', NULL
FROM _mc_backfill_merge_branch b
CROSS JOIN "member.plans" mp
WHERE b.expr = 'active_abo'
UNION ALL
-- active_abo_with_payment:<method>:<days> (payment condition is dropped)
SELECT b.provider_id, b.tag, b.expr, mp.id, 'active', NULL
FROM _mc_backfill_merge_branch b
CROSS JOIN "member.plans" mp
WHERE b.expr ~ '^active_abo_with_payment:'
UNION ALL
-- retarget:<days> (account-wide -> every plan), legacy default was 45 days
SELECT b.provider_id, b.tag, b.expr, mp.id, 'retarget',
       COALESCE(substring(b.expr from '^retarget:([0-9]+)')::integer, 45)
FROM _mc_backfill_merge_branch b
CROSS JOIN "member.plans" mp
WHERE b.expr ~ '^retarget(:|$)';

-- Resolve interest group branches to concrete member plans.
CREATE TEMPORARY TABLE _mc_backfill_interest_plan AS
SELECT b.provider_id, b.group_id, b.expr, mp.id AS member_plan_id
FROM _mc_backfill_interest_branch b
JOIN "member.plans" mp ON mp.slug = btrim(substring(b.expr from '^slug:equals:(.*)$'))
WHERE b.expr ~ '^slug:equals:'
  AND btrim(substring(b.expr from '^slug:equals:(.*)$')) <> ''
UNION ALL
SELECT b.provider_id, b.group_id, b.expr, mp.id
FROM _mc_backfill_interest_branch b
CROSS JOIN "member.plans" mp
WHERE b.expr ~ '^slug:contains:'
  AND btrim(substring(b.expr from '^slug:contains:(.*)$')) <> ''
  AND position(btrim(substring(b.expr from '^slug:contains:(.*)$')) in mp.slug) > 0
UNION ALL
SELECT b.provider_id, b.group_id, b.expr, mp.id
FROM _mc_backfill_interest_branch b
CROSS JOIN LATERAL unnest(string_to_array(substring(b.expr from '^slug:contains_any:(.*)$'), ',')) AS needle
CROSS JOIN "member.plans" mp
WHERE b.expr ~ '^slug:contains_any:'
  AND btrim(needle) <> ''
  AND position(btrim(needle) in mp.slug) > 0;

-- Every (provider, member plan) pair that ends up with at least one mapping.
CREATE TEMPORARY TABLE _mc_backfill_key AS
SELECT provider_id, member_plan_id FROM _mc_backfill_merge_plan
UNION
SELECT provider_id, member_plan_id FROM _mc_backfill_interest_plan;

-- Pairs that are already configured. These keep their existing row, so the
-- legacy configuration for them is dropped — recorded here to be warned about.
CREATE TEMPORARY TABLE _mc_backfill_conflict AS
SELECT k.provider_id, k.member_plan_id
FROM _mc_backfill_key k
JOIN "mailchimp_mappings" m
  ON m."syncProviderId" = k.provider_id
 AND m."memberPlanId" = k.member_plan_id;

INSERT INTO "mailchimp_mappings" (
    "modifiedAt",
    "syncProviderId",
    "memberPlanId",
    "activeFieldIds",
    "retargetFieldIds",
    "retargetDelayDays",
    "interestGroupIds"
)
SELECT
    CURRENT_TIMESTAMP,
    k.provider_id,
    k.member_plan_id,
    COALESCE(a.tags, '[]'::jsonb),
    COALESCE(r.tags, '[]'::jsonb),
    COALESCE(r.delay_days, 30),
    COALESCE(g.group_ids, '[]'::jsonb)
FROM _mc_backfill_key k
LEFT JOIN (
    SELECT provider_id, member_plan_id, jsonb_agg(DISTINCT tag ORDER BY tag) AS tags
    FROM _mc_backfill_merge_plan
    WHERE kind = 'active'
    GROUP BY provider_id, member_plan_id
) a ON a.provider_id = k.provider_id AND a.member_plan_id = k.member_plan_id
LEFT JOIN (
    SELECT provider_id, member_plan_id,
           jsonb_agg(DISTINCT tag ORDER BY tag) AS tags,
           max(days) AS delay_days
    FROM _mc_backfill_merge_plan
    WHERE kind = 'retarget'
    GROUP BY provider_id, member_plan_id
) r ON r.provider_id = k.provider_id AND r.member_plan_id = k.member_plan_id
LEFT JOIN (
    SELECT provider_id, member_plan_id, jsonb_agg(DISTINCT group_id ORDER BY group_id) AS group_ids
    FROM _mc_backfill_interest_plan
    GROUP BY provider_id, member_plan_id
) g ON g.provider_id = k.provider_id AND g.member_plan_id = k.member_plan_id
ON CONFLICT ("syncProviderId", "memberPlanId") DO NOTHING;

-- Name merge fields move onto the provider itself. Only fill columns that are
-- still at their default so a configuration saved through the new UI wins.
UPDATE "settings.syncprovider" sp
SET "firstnameFields" = t.tags
FROM (
    SELECT provider_id, jsonb_agg(DISTINCT tag ORDER BY tag) AS tags
    FROM _mc_backfill_merge_branch
    WHERE expr = 'user.firstName'
    GROUP BY provider_id
) t
WHERE sp.id = t.provider_id
  AND sp."firstnameFields" = '[]'::jsonb;

UPDATE "settings.syncprovider" sp
SET "lastnameFields" = t.tags
FROM (
    SELECT provider_id, jsonb_agg(DISTINCT tag ORDER BY tag) AS tags
    FROM _mc_backfill_merge_branch
    WHERE expr = 'user.name'
    GROUP BY provider_id
) t
WHERE sp.id = t.provider_id
  AND sp."lastnameFields" = '[]'::jsonb;

-- Report everything that could not be translated so it can be re-entered by hand.
DO $$
DECLARE
    rec RECORD;
    total integer;
BEGIN
    SELECT count(*) INTO total FROM _mc_backfill_key;
    SELECT total - count(*) INTO total FROM _mc_backfill_conflict;
    RAISE NOTICE 'mailchimp backfill: created % mailchimp_mappings row(s)', total;

    FOR rec IN
        SELECT c.provider_id, p.slug
        FROM _mc_backfill_conflict c
        JOIN "member.plans" p ON p.id = c.member_plan_id
        ORDER BY c.provider_id, p.slug
    LOOP
        RAISE WARNING 'mailchimp backfill: sync provider % already has a mapping for member plan "%" — kept it and discarded the legacy configuration for that plan',
            rec.provider_id, rec.slug;
    END LOOP;

    FOR rec IN
        SELECT b.provider_id, b.tag, b.expr
        FROM _mc_backfill_merge_branch b
        WHERE b.expr NOT IN ('user.firstName', 'user.name')
          AND NOT EXISTS (
              SELECT 1 FROM _mc_backfill_merge_plan p
              WHERE p.provider_id = b.provider_id AND p.tag = b.tag AND p.expr = b.expr
          )
        ORDER BY b.provider_id, b.tag, b.expr
    LOOP
        RAISE WARNING 'mailchimp backfill: merge field "%" on sync provider % could not be mapped (expression "%") — reconfigure it manually',
            rec.tag, rec.provider_id, rec.expr;
    END LOOP;

    FOR rec IN
        SELECT b.provider_id, b.group_id, b.expr
        FROM _mc_backfill_interest_branch b
        WHERE NOT EXISTS (
            SELECT 1 FROM _mc_backfill_interest_plan p
            WHERE p.provider_id = b.provider_id AND p.group_id = b.group_id AND p.expr = b.expr
        )
        ORDER BY b.provider_id, b.group_id, b.expr
    LOOP
        RAISE WARNING 'mailchimp backfill: interest group % on sync provider % could not be mapped (expression "%") — reconfigure it manually',
            rec.group_id, rec.provider_id, rec.expr;
    END LOOP;

    FOR rec IN
        SELECT DISTINCT b.provider_id, b.tag, b.expr
        FROM _mc_backfill_merge_branch b
        WHERE b.expr ~ '^active_abo_with_payment:'
        ORDER BY b.provider_id, b.tag, b.expr
    LOOP
        RAISE WARNING 'mailchimp backfill: merge field "%" on sync provider % used "%" — the payment method condition has no equivalent and was dropped, the tag is now a plain active flag',
            rec.tag, rec.provider_id, rec.expr;
    END LOOP;
END $$;

DROP TABLE _mc_backfill_conflict;
DROP TABLE _mc_backfill_key;
DROP TABLE _mc_backfill_interest_plan;
DROP TABLE _mc_backfill_merge_plan;
DROP TABLE _mc_backfill_interest_branch;
DROP TABLE _mc_backfill_merge_branch;
