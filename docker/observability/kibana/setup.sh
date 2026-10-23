#!/bin/sh
set -eu

KIBANA_URL="${KIBANA_URL:-http://kibana:5601}"

until curl -fs "$KIBANA_URL/api/status" >/dev/null; do
  sleep 5
done

create_data_view() {
  curl -fsS -X POST "$KIBANA_URL/api/data_views/data_view" \
    -H 'kbn-xsrf: true' \
    -H 'Content-Type: application/json' \
    -d "{\"override\":true,\"data_view\":{\"id\":\"$1\",\"title\":\"$2\",\"name\":\"$3\",\"timeFieldName\":\"@timestamp\"}}" \
    >/dev/null
  echo "data view $1 ($2) ready"
}

create_data_view wepublish-logs 'logs-*' 'We.Publish logs'
create_data_view wepublish-traces 'traces-*' 'We.Publish traces'
create_data_view wepublish-logstash 'logstash-wepublish-*' 'We.Publish logs via Logstash'
