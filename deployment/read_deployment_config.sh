#!/bin/bash
KEY=$1
VALUE=$2
PROJECT=$3
files=$(find apps -mindepth 2 -maxdepth 2 -type f -name deployment.config.json)
for file in $files; do
  if [[ $(jq "$KEY" "$file") == "$VALUE" ]]; then
    targets=$(echo $targets $(dirname "$file" | xargs -n 1 basename))
  fi
done

# If project is passed check for the project
if [[ ! -z $PROJECT ]]; then
  if [[ -z $(echo "@$targets@" |sed "s/ /@/g" |grep "@${PROJECT}@") ]]; then
    echo "Project <$PROJECT> has no website, skipping..."
    echo ::set-output name=has-website::false
  else
    echo "Project <$PROJECT> has website."
    echo ::set-output name=has-website::true
  fi
  exit 0
fi

matrix="{\"target\":["
for target in $targets; do
	matrix="${matrix}\"${target}\","
done
matrix="${matrix%,}]}"
echo "::set-output name=matrix::${matrix}"
