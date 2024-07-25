#!/bin/bash
MODE=$1

# Mode to clean secrets from build
if [[ $MODE == "clean" ]]; then
  if [[ -f secrets.list ]]; then
    for s in $(cat secrets.list); do
      echo "Removed secret variable ${s}"
      sed -i "s/\"$(echo ${s} | cut -d'=' -f 2)\"/\"@@@$(echo ${s} | cut -d'=' -f 1)@@@\"/g" $(grep -rl "\"$(echo ${s} | cut -d'=' -f 2)\"" /wepublish/dist/)
    done
    rm secrets.list # Cleanup
  fi
  exit 0
fi

# Mode to add secrets again to the build
if [[ $MODE == "restore" ]]; then
  if [[ -f secrets_name.list ]]; then
    for n in $(cat secrets_name.list); do

      # Exit if en env is missing!
      if [[ -z ${!n} ]]; then
        echo "Secret env ${n} not set!"
        exit 99
      fi
      echo "Inserted secret variable ${n}"
      sed -i "s/\"@@@${n}@@@\"/\"${!n}\"/g" $(grep -rl "\"@@@${n}@@@\"" /wepublish)
    done
  fi
  exit 0
fi
exit 99