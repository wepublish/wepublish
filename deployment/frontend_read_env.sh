#!/bin/bash
ENV=$1
PROJECT=$2
FORMAT=$3
shift 3
customVars=$(jq -r ".frontend.${ENV}.env | to_entries | map(\"\(.key)=\(.value|tostring)\") | .[]" apps/${PROJECT}/deployment.config.json)
for var in $customVars; do
  envvars="${envvars}${var}\n"
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