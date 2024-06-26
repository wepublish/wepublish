KEY=$1
VALUE=$2
files=$(find apps -mindepth 2 -maxdepth 2 -type f -name .deployment.config.json)  #-exec dirname {} \; | xargs -n 1 basename)
for file in $files; do
  if [[ $(jq "$KEY" "$file") == "$VALUE" ]]; then
    targets=$(echo $targets $(dirname "$file" | xargs -n 1 basename))
  fi
done
matrix="{\"target\":["
for target in $targets; do
	matrix="${matrix}\"${target}\","
done
matrix="${matrix%,}]}"  # Remove trailing comma and add closing brackets
echo "::set-output name=matrix::${matrix}"
