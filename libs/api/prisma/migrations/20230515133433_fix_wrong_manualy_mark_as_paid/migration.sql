-- CreateFunction
CREATE OR REPLACE FUNCTION fix_wrong_set_paidUntil() RETURNS void AS $$
DECLARE
f record;
BEGIN
    FOR f IN SELECT s.id, sp."endsAt" FROM invoices AS i JOIN subscriptions s ON i."subscriptionID" = s.id JOIN "subscriptions.periods" sp ON i.id = sp."invoiceID" WHERE i."manuallySetAsPaidByUserId" IS NOT NULL AND (sp."endsAt" > s."paidUntil" OR "paidUntil" IS NULL)
    LOOP
        UPDATE subscriptions SET "paidUntil" = f."endsAt" WHERE id = f.id;
    END LOOP;
END
$$ LANGUAGE plpgsql;

-- RunFunction
SELECT fix_wrong_set_paidUntil();

-- DropFunction
DROP FUNCTION fix_wrong_set_paidUntil;
