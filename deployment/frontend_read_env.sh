#!/bin/bash
ENV=$1
PROJECT=$2
DEPLOYMENT=$3
SECURE_ENV_PRFIX="DEPLOYMENT_${PROJECT^^}_"
PROJECT_FILE=apps/${PROJECT}/deployment.config.json
echo $SECRETS
shift 3
SECRETS_CONTEXT=$(cat secrets.json)

# Add env from env files
customVars=$(jq -r ".frontend.${ENV}.env | to_entries | map(\"\(.key)=\(.value|tostring)\") | .[]" $PROJECT_FILE)
for var in $customVars; do
  envvars="${envvars}${var}\n"
done

# Add secrets to env
secretenvvars=""
for secret in $(jq -r ".frontend.${ENV}.secret_env[]" "$PROJECT_FILE"); do
  echo "${secret}" |grep -v "$(echo $arg |cut -d '=' -f 1)=" > /dev/null
  if [[ $? == 0 ]]; then
    value=$(echo ${SECRETS_CONTEXT} |jq "." |grep $SECURE_ENV_PRFIX | sed "s/$SECURE_ENV_PRFIX//g" |grep "\"$secret\":" | cut -d':' -f 2 |sed 's/[ "]//g')
    if [[ -z $value ]]; then
      echo "${secret} => ${SECURE_ENV_PRFIX}${secret} not found in repo secrets on github!"
      continue
    fi
    secretenvvars="${secretenvvars}${secret}=${value}\n"
  fi
done

# Add default env from cli
for arg in "$@"; do
    echo "${envvars}" |grep -v "$(echo $arg |cut -d '=' -f 1)=" > /dev/null
    if [[ $? == 0 ]]; then
      envvars="${envvars}${arg}\n"
    fi
done

if [[ $DEPLOYMENT == "helm" ]]; then
  envvars=$(echo "$envvars" | sed 's/=/: /g')
fi

if [[  $DEPLOYMENT == "docker"  ]]; then
  for var in $(echo $secretenvvars |sed 's/\\n/ /g' ); do
    echo "$(echo ${var})" >> secrets.list
    echo "$(echo ${var} |cut -d'=' -f 1)" >> secrets_name.list
    sed -i "s|### FRONT_ARG_REPLACER ###|ARG $(echo ${var} |cut -d'=' -f 1)\n### FRONT_ARG_REPLACER ###|g" Dockerfile
  done
  for var in $(echo $envvars |sed 's/\\n/ /g' ); do
    sed -i "s|### FRONT_ARG_REPLACER ###|ENV ${var}\n### FRONT_ARG_REPLACER ###|g" Dockerfile
  done
fi

if [[ ! -z ${secretenvvars} ]];then
  envvars="${envvars} ${secretenvvars}"
fi

envvars="${envvars//'%'/'%25'}"
envvars="${envvars//$'\n'/'%0A'}"
envvars="${envvars//'\n'/'%0A'}"
envvars="${envvars/ /'\n'/'%0A'}"
envvars="${envvars//$'\r'/'%0D'}"
echo "::set-output name=envvars::${envvars}"