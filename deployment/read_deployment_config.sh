#!/bin/bash
KEY=$1
VALUE=$2
PROJECT=$3
MODE=$4
ARGUMENT=$5
files=$(find apps -mindepth 2 -maxdepth 2 -type f -name deployment.config.json)
for file in $files; do
  if [[ $(jq "$KEY" "$file") == "$VALUE" ]]; then
    targets=$(echo $targets $(dirname "$file" | xargs -n 1 basename))
  fi
done

if [[ $MODE == "getValue" ]]; then
  file=$(find apps -mindepth 2 -maxdepth 2 -type f -name deployment.config.json | grep $PROJECT)
  value=$(jq $KEY $file |sed 's/"//g')
  if [[ ! -z $ARGUMENT ]] && [[ $value == "null" ]]; then
    value=$ARGUMENT
  fi
  echo "value=${value}" >> "$GITHUB_OUTPUT"
  exit 0
fi


# If project is passed check for the project
if [[ ! -z $PROJECT ]]; then
  if [[ -z $(echo "@$targets@" |sed "s/ /@/g" |grep "@${PROJECT}@") ]]; then
    echo "Project <$PROJECT> has no website, skipping..."
    echo "has-website=false" >> "$GITHUB_OUTPUT"
  else
    echo "Project <$PROJECT> has website."
    echo "has-website=true" >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

matrix="{\"target\":["
for target in $targets; do
	matrix="${matrix}\"${target}\","
done
matrix="${matrix%,}]}"
echo "matrix=${matrix}" >> "$GITHUB_OUTPUT"
