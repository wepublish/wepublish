#!/bin/bash

SOURCE_FILE_LOCAL='.env.local'
SOURCE_FILE_TEMPLATE='.env'
TMP_DIR=/tmp
missing_config() {
  echo "You need to set PRODUCTION_DUMP_WEB_URL=https://<htpasswed user>:<htpasswed password>@<dump url> in the <${SOURCE_FILE_LOCAL}> file!"
  exit 99
}

command -v curl >/dev/null || { echo "curl not found" >&2; exit 2; }
command -v gzip >/dev/null || { echo "gzip not found" >&2; exit 2; }
command -v psql >/dev/null || { echo "psql not found" >&2; exit 2; }

if [[ ! -f $SOURCE_FILE_LOCAL ]]; then
  missing_config
fi

load_env_file() {
  local file=$1
  local override=${2:-false}

  [[ -f "$file" ]] || return 0

  while IFS='=' read -r key value; do
    [[ $key == '' || $key == \#* ]] && continue
    value=${value%$'\r'}
    if [[ $override == true ]]; then
      export "$key=$value"
    elif [[ -z ${!key} ]]; then
      export "$key=$value"
    fi
  done < "$file"
}

load_env_file "$SOURCE_FILE_TEMPLATE"
load_env_file "$SOURCE_FILE_LOCAL" true

if [[ -z $PRODUCTION_DUMP_WEB_URL ]]; then
  missing_config
fi

if [[ -z $DATABASE_URL ]]; then
  echo "DATABASE_URL is missing in ${SOURCE_FILE_LOCAL} or ${SOURCE_FILE_TEMPLATE}"
  exit 99
fi
DATABASE_URL=$(echo $DATABASE_URL | cut -d'?' -f1)

PROJECT=$1
if [[ -z $PROJECT ]]; then
  echo "You need to pass the project as argument:"
  echo "    $0 <project>"
  exit 99
fi

echo "⚠️  WARNING: This will OVERWRITE the existing database! ($DATABASE_URL)"
read -r -p "Type 'yes' to continue: " CONFIRM
if [[ "${CONFIRM,,}" != "yes" ]]; then
  echo "❌ Aborted."
  exit 1
fi
echo "✅  Downloading..."

HTTP_CODE=$(curl -s -w "%{http_code}" -o "${TMP_DIR}/database.dump.gz" \
  "${PRODUCTION_DUMP_WEB_URL}/${PROJECT}.sql.gz")

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "❌  Error: Download dump failed with HTTP status ${HTTP_CODE}" >&2
  exit 1
fi
echo "✅  Download successful (${HTTP_CODE})"

echo "⏳  Unpack database dump..."
gzip -d -f "${TMP_DIR}/database.dump.gz"
echo "✅  Unpack database dump successful"

# A dump truncated inside a COPY block restores without any error (EOF ends
# the COPY), silently dropping data and all indexes. The trailing marker is
# the only reliable truncation check. Old dumps predate the marker, so allow
# an explicit override.
if ! tail -n 2 "${TMP_DIR}/database.dump" | grep -q "WEPUBLISH_DUMP_COMPLETE"; then
  echo "⚠️  Warning: dump has no completeness marker - it may be TRUNCATED, or it predates marker support."
  read -r -p "Restore anyway? Type 'yes' to continue: " CONFIRM_MARKER
  if [[ "${CONFIRM_MARKER,,}" != "yes" ]]; then
    echo "❌ Aborted."
    rm "${TMP_DIR}/database.dump"
    exit 1
  fi
fi

# Older dumps miss extensions entirely (excluded by --schema=public), and
# creating them beforehand does not help since the dump drops the public
# schema (and with it the extension) first. Inject the statement right after
# the schema is recreated instead.
if ! grep -q "CREATE EXTENSION IF NOT EXISTS pg_trgm" "${TMP_DIR}/database.dump"; then
  echo "⏳  Injecting missing pg_trgm extension into dump..."
  awk '{print} /^CREATE SCHEMA public;$/ && !done {print "CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;"; done=1}' \
    "${TMP_DIR}/database.dump" > "${TMP_DIR}/database.dump.patched" \
    && mv "${TMP_DIR}/database.dump.patched" "${TMP_DIR}/database.dump"
fi

echo "⏳  Replacing database: $DATABASE_URL"
# ON_ERROR_STOP fails on the first error instead of silently continuing;
# --single-transaction rolls everything back on failure, so a failed restore
# can never leave a partial schema behind.
psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --single-transaction \
  -f "${TMP_DIR}/database.dump" 1> ${TMP_DIR}/database_restore.log 2>&1
if [[ $? != 0 ]]; then
  echo "❌  Error: Replacing database failed, database rolled back to previous state." >&2
  echo "    See log ${TMP_DIR}/database_restore.log - last lines:" >&2
  tail -n 5 "${TMP_DIR}/database_restore.log" >&2
  rm "${TMP_DIR}/database.dump"
  exit 1
else
  echo "✅  Replacing database successful"
fi

echo "⏳  Cleaning up database dump..."
rm "${TMP_DIR}/database.dump"
echo "✅  Cleaning up database dump"