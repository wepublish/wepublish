#!/bin/bash
MODE=$1
if [[ -f secrets.list ]]; then
  if [[ $MODE == "clean" ]]; then
    for s in $(cat secrets.list); do
      sed -i "s/\"$(echo ${s} | cut -d'=' -f 2)\"/\"@@@$(echo ${s} | cut -d'=' -f 1)@@@\"/g" $(grep -rl "\"$(echo ${s} | cut -d'=' -f 2)\"" /wepublish/dist/)
    done
    exit 0
  fi
fi

if [[ -f secrets_name.list ]]; then
  if [[ $MODE == "restore" ]]; then
    for n in $(cat secrets_name.list); do
      sed -i "s/\"@@@${n}@@@\"/\"${!n}\"/g" $(grep -rl "\"@@@${n}@@@\"" /wepublish)
    done
    exit 0
  fi
fi
exit 99