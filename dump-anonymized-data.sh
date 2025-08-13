#!/bin/bash

# Production to Staging Database Dump Script
# Dumps schema and anonymizes sensitive data
# Usage: ./dump-anonymized-data.sh "postgresql://user:password@host:port/database"

if [ -z "$1" ]; then
  echo "Usage: $0 <postgresql-connection-url>"
  echo "Example: $0 'postgresql://postgres:password@localhost:5432/wepublish'"
  exit 1
fi

DATABASE_URL="$1"

echo "Creating complete dump with schema and anonymized data" >&2

# First disable foreign key checks and drop all tables and types
echo "-- Drop all existing tables and types in public schema"
echo "SET session_replication_role = replica;"
echo ""
echo "DO \$\$ DECLARE"
echo "    r RECORD;"
echo "BEGIN"
echo "    -- Drop all tables in public schema"
echo "    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename DESC) LOOP"
echo "        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';"
echo "    END LOOP;"
echo "    -- Drop all custom types in public schema"
echo "    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') LOOP"
echo "        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';"
echo "    END LOOP;"
echo "END \$\$;"
echo ""
echo "SET session_replication_role = DEFAULT;"
echo ""

# Then dump the complete schema (without DROP statements since we already dropped everything)
echo "-- Database schema dump"
pg_dump \
  "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --schema-only \
  --exclude-schema=pgboss

echo ""
echo "-- Begin data insertion"
echo ""

# Then output anonymized users table using COPY format
echo "-- Users table with admin/editors preserved and regular users anonymized"
echo "COPY public.users (id, \"createdAt\", \"modifiedAt\", birthday, email, \"emailVerifiedAt\", name, \"firstName\", flair, password, active, \"lastLogin\", \"roleIDs\", \"userImageID\") FROM stdin;"
psql \
  "$DATABASE_URL" \
  --no-align \
  --tuples-only \
  --quiet \
  --field-separator=$'\t' \
  --pset="null=\\N" \
  --command="
    SELECT 
      id,
      \"createdAt\",
      \"modifiedAt\",
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN birthday
        ELSE NULL::date
      END,
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN email
        ELSE 'devuser+' || id || '@wepublish.dev'
      END,
      \"emailVerifiedAt\",
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN name
        ELSE 'User ' || id
      END,
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN \"firstName\"
        ELSE 'Test'
      END,
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN flair
        ELSE NULL::text
      END,
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN password
        ELSE '\$2b\$10\$dummy.hash.for.testing.purposes.only'
      END,
      active,
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN \"lastLogin\"
        ELSE NULL::timestamp
      END,
      \"roleIDs\",
      CASE 
        WHEN array_length(\"roleIDs\", 1) > 0 THEN \"userImageID\"
        ELSE NULL::text
      END
    FROM users
    ORDER BY id;
  "
echo "\\."

# Then dump everything except highly sensitive tables and pgboss schema
pg_dump \
  "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --data-only \
  --exclude-schema=pgboss \
  --exclude-table='"users.addresses"' \
  --exclude-table='"users.oauth2-accounts"' \
  --exclude-table='"users.payment-providers"' \
  --exclude-table=sessions \
  --exclude-table='"comments.ratings"' \
  --exclude-table='"mail.log"' \
  --exclude-table=invoices \
  --exclude-table='"invoices.items"' \
  --exclude-table=subscriptions \
  --exclude-table='"subscriptions.periods"' \
  --exclude-table='"subscriptions.deactivation-reasons"' \
  --exclude-table='"user-consents"' \
  --exclude-table='"polls.votes"' \
  --exclude-table=users
