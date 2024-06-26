#!/bin/bash
ENV=$1
PROJECT=$2
customVars=$(jq -r ".frontend.${ENV}.env | to_entries | map(\"\(.key)=\(.value|tostring)\") | .[]" apps/${PROJECT}/deployment.config.json)
for var in $customVars; do
  envvars="${envvars}${var}\n"
done
echo -e "::set-output name=envvars::\n${envvars}"