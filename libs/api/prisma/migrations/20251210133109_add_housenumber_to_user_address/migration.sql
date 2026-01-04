-- AlterTable

ALTER TABLE "users.addresses" RENAME COLUMN "streetAddress" TO "streetAddress_original_20251210";
ALTER TABLE "users.addresses" ADD COLUMN "streetAddress" TEXT;
ALTER TABLE "users.addresses" ADD COLUMN  "streetAddressNumber" TEXT;

UPDATE "users.addresses"
    SET
        "streetAddressNumber" = TRIM(REGEXP_REPLACE("streetAddress_original_20251210", '^[^\d]*', '')),
        "streetAddress"       = TRIM(REGEXP_REPLACE("streetAddress_original_20251210", '\s*\d.*$', ''));




ALTER TABLE "users.addresses" RENAME COLUMN "streetAddress2" TO "streetAddress2_original_20251210";
ALTER TABLE "users.addresses" ADD COLUMN "streetAddress2" TEXT;
ALTER TABLE "users.addresses" ADD COLUMN  "streetAddress2Number" TEXT;

UPDATE "users.addresses"
SET
    "streetAddress2Number" = TRIM(REGEXP_REPLACE("streetAddress2_original_20251210", '^[^\d]*', '')),
    "streetAddress2"       = TRIM(REGEXP_REPLACE("streetAddress2_original_20251210", '\s*\d.*$', ''));

