-- A non-default communication flow whose member plan was deleted lost its plan
-- (the foreign key sets it to null) and makes every lookup of an automatic
-- message fail, so no subscription gets one. Such a flow can never match a
-- subscription again; remove it. Its intervals go with it by cascade.
--
-- A flow for all member plans has no member plan either, on purpose. Where
-- that column already exists (the two changes can land in either order),
-- those flows are kept.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'subscription_communication_flows'
      AND column_name = 'allMemberPlans'
  ) THEN
    EXECUTE '
      DELETE FROM "subscription_communication_flows"
      WHERE "default" = false
        AND "memberPlanId" IS NULL
        AND "allMemberPlans" = false';
  ELSE
    DELETE FROM "subscription_communication_flows"
    WHERE "default" = false
      AND "memberPlanId" IS NULL;
  END IF;
END
$$;
