#!/bin/bash
ENV=$1
PROJECT=$2
customVars=$(jq -r ".frontend.${ENV}.env | to_entries | map(\"\(.key)=\(.value|tostring)\") | .[]" apps/${PROJECT}/deployment.config.json)
for var in $customVars; do
  envvars="${envvars}${var}\n"
done
envvars="${envvars//'%'/'%25'}"
envvars="${envvars//$'\n'/'%0A'}"
envvars="${envvars//'\n'/'%0A'}"
envvars="${envvars//$'\r'/'%0D'}"
echo "::set-output name=envvars::${envvars}"