#!/bin/bash
MODE=$1
if [[ $MODE == "clean" ]]; then
  if [[ -f secrets.list ]]; then
    for s in $(cat secrets.list); do
      echo "Removed secret variable ${s}"
      sed -i "s/\"$(echo ${s} | cut -d'=' -f 2)\"/\"@@@$(echo ${s} | cut -d'=' -f 1)@@@\"/g" $(grep -rl "\"$(echo ${s} | cut -d'=' -f 2)\"" /wepublish/dist/)
      ls -la
      echo STRING:
      echo "grep -rl "\"$(echo ${s} | cut -d'=' -f 2)\"" /wepublish/dist/"
      echo GREP:
      grep -rl "\"$(echo ${s} | cut -d'=' -f 2)\"" /wepublish/dist/
      echo "OK:"
      cat secrets.list
    done
  fi
  exit 0
fi


if [[ $MODE == "restore" ]]; then
  if [[ -f secrets_name.list ]]; then
    for n in $(cat secrets_name.list); do
      echo "Inserted secret variable ${n}"
      sed -i "s/\"@@@${n}@@@\"/\"${!n}\"/g" $(grep -rl "\"@@@${n}@@@\"" /wepublish)
    done
  fi
  exit 0
fi
exit 99