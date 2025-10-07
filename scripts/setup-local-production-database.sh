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
source $SOURCE_FILE_LOCAL
source $SOURCE_FILE_TEMPLATE
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

echo "⏳  Unpack database dump"
gzip -d "${TMP_DIR}/database.dump.gz"
echo "✅  Unpack database duump successful!"

echo "⏳  Replacing database: $DATABASE_URL"
psql "$DATABASE_URL" -f "${TMP_DIR}/database.dump" 1> /dev/null
echo "✅  Replacing database successful"

echo "⏳  Cleaning up database dump"
rm "${TMP_DIR}/database.dump"
echo "✅  Cleaning up database dump"