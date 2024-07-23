#!/bin/bash
PROJECT=$(echo $1 |cut -d'_' -f 2 )
VERSION=$(echo $1 |cut -d'_' -f 3 )

# Check that correct parameters are passed
if [[ -z $PROJECT ]] || [[ -z $VERSION ]] || [[ ! -z $(echo $1 |cut -d'_' -f 4 ) ]]; then
  echo "Wong format $1 != deployment_\${project}_\${version_number}"
  exit 1
fi

# Check if project and config of project exists
if [[ ! -f apps/${PROJECT}/deployment.config.json ]]; then
    echo "Given project <$PROJECT> does not exist or does not have a config <deployment.config.json>!"
    exit 2
fi

# Check if version consists of 12 numbers only
if [[ ! $VERSION =~ ^[0-9]{12}$ ]]; then
  echo "Version <${VERSION}> wrong format YYYYMMDDHHMM eg. 2024070200"
  exit 2
fi

echo "::set-output name=project::${PROJECT}"
echo "::set-output name=version::${VERSION}"