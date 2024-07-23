#!/bin/bash

# Read cli args
ENV=$1
PROJECT=$2
DEPLOYMENT=$3

# Static variables
SECURE_ENV_PRFIX="DEPLOYMENT_${PROJECT^^}_"
PROJECT_FILE=apps/${PROJECT}/deployment.config.json

# Shift 3 arguments to remove them from stack
shift 3

# Add env from env files
customVars=$(jq -r ".website.${ENV}.env | to_entries | map(\"\(.key)=\(.value|tostring)\") | .[]" $PROJECT_FILE)
for var in $customVars; do
  envvars="${envvars}${var}\n"
done

# Add secrets to env from github secrets
secretenvvars=""
for secret in $(jq -r ".website.${ENV}.secret_env[]" "$PROJECT_FILE"); do

  # Check if secure env exists
  echo "${secret}" |grep -v "$(echo $arg |cut -d '=' -f 1)=" > /dev/null
  if [[ $? == 0 ]]; then

    # Get secure variable from github
    value=$(echo ${SECRETS_CONTEXT} |jq "." |grep $SECURE_ENV_PRFIX | sed "s/$SECURE_ENV_PRFIX//g" |grep "\"$secret\":" | cut -d':' -f 2 |sed 's/[ "]//g'|sed 's/,//g')

    # Warn user if a secret variable is set in config file but is missing in github secure context
    if [[ -z $value ]]; then
      echo "${secret} => ${SECURE_ENV_PRFIX}${secret} not found in repo secrets on github!"
      continue
    fi

    secretenvvars="${secretenvvars}${secret}=${value}\n"
  fi
done

# Add default env passed as arguments from cli
for arg in "$@"; do
    echo "${envvars}" |grep -v "$(echo $arg |cut -d '=' -f 1)=" > /dev/null
    if [[ $? == 0 ]]; then
      envvars="${envvars}${arg}\n"
    fi
done

if [[  $DEPLOYMENT == "docker"  ]]; then

  # Ensure file is present to ensure one is present since docker build process depends on it.
  touch secrets_name.list

  for var in $(echo $secretenvvars |sed 's/\\n/ /g' ); do

    # Write secrets list und secrete name list to clean and read on docker startup secrets with map-secrets.sh scripts
    echo "${var}" >> secrets.list
    echo "$(echo ${var} |cut -d'=' -f 1)" >> secrets_name.list

    # Add secrets as build arguments to docker file
    sed -i "s|### FRONT_ARG_REPLACER ###|ARG $(echo ${var} |cut -d'=' -f 1)\n### FRONT_ARG_REPLACER ###|g" Dockerfile
  done
  for var in $(echo $envvars |sed 's/\\n/ /g' ); do
    # Add public env variables as env to docker file
    sed -i "s|### FRONT_ARG_REPLACER ###|ENV ${var}\n### FRONT_ARG_REPLACER ###|g" Dockerfile
  done
fi

if [[ ! -z ${secretenvvars} ]];then
  # Add secret env vars to output to use by docker build
  envvars="${envvars}${secretenvvars}"
fi

# Convert env output to helm compatible yaml output
if [[ $DEPLOYMENT == "helm" ]]; then
  envvars=$(echo "$envvars" | sed 's/=/: /g')
fi

# Clean special chars to make multiline usable by github action
envvars="${envvars//'%'/'%25'}"
envvars="${envvars//$'\n'/'%0A'}"
envvars="${envvars//'\n'/'%0A'}"
envvars="${envvars//$'\r'/'%0D'}"

# Clean spaces only if normal env not on yaml
if [[ $MODE == "docker" ]]; then
  envvars="${envvars/ /'\n'/'%0A'}"
fi

# Return variables
echo "::set-output name=envvars::${envvars}"