UPDATE "subscriptions.deactivation-reasons" dr
SET date = COALESCE(s."paidUntil", s."startsAt")
FROM subscriptions s
WHERE dr."subscriptionID" = s.id;