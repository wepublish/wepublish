-- A non-default communication flow whose member plan was deleted lost its plan
-- (the foreign key sets it to null) and makes every lookup of an automatic
-- message fail, so no subscription gets one. Such a flow can never match a
-- subscription again; remove it. Its intervals go with it by cascade.
DELETE FROM "subscription_communication_flows"
WHERE "default" = false
  AND "memberPlanId" IS NULL;
