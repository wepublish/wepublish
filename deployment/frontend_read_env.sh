#!/bin/bash
ENV=$1
PROJECT=$2
FORMAT=$3
SECRETS=$(echo ${SECRETS_CONTEXT} |jq "." |grep "DEPLOYMENT_" )
PROJECT_FILE=apps/${PROJECT}/deployment.config.json
shift 3

envvars=""
customVars=$(jq -r ".frontend.${ENV}.env | to_entries | map(\"\(.key)=\(.value|tostring)\") | .[]" $PROJECT_FILE)
for var in $customVars; do
  envvars="${envvars}${var}\n"
done

for secret in $(jq -r ".frontend.${ENV}.secret_env[]" "$PROJECT_FILE"); do
  echo "${secret}" |grep -v "$(echo $arg |cut -d '=' -f 1)=" > /dev/null
  if [[ $? == 0 ]]; then
    value=$(echo $SECRETS |grep "\"$secret\":" | cut -d':' -f 2 |sed 's/[ "]//g')
    if [[ -z $value ]]; then
      continue
    fi
    envvars="${envvars}${secret}=${value}\n"
  fi
done


for arg in "$@"; do
    echo "${envvars}" |grep -v "$(echo $arg |cut -d '=' -f 1)=" > /dev/null
    if [[ $? == 0 ]]; then
      envvars="${envvars}${arg}\n"
    fi
done

if [[ $FORMAT == "yaml" ]]; then
  envvars=$(echo "$envvars" | sed 's/=/: /g')
fi

envvars="${envvars//'%'/'%25'}"
envvars="${envvars//$'\n'/'%0A'}"
envvars="${envvars//'\n'/'%0A'}"
envvars="${envvars//$'\r'/'%0D'}"
echo "::set-output name=envvars::${envvars}"