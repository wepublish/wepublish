const {setFailed} = require('@actions/core')
const {GITHUB_REF_SHORT} = require('./notify-utils')

async function main() {
  const {BRANCH_NAME, PR_NUMBER} = process.env

  const deploymentMessage = `<a href="https://github.com/wepublish/wepublish/pull/${PR_NUMBER}">PR ${PR_NUMBER}</a> with branch \`${BRANCH_NAME}\` has been deployed to:
  - Website: https://${GITHUB_REF_SHORT}.wepublish.dev
  - Editor: https://editor.${GITHUB_REF_SHORT}.wepublish.dev
  - Public API: https://api.${GITHUB_REF_SHORT}.wepublish.dev
  - Privat API: https://api.${GITHUB_REF_SHORT}.wepublish.dev/admin
  - Media: https://media.${GITHUB_REF_SHORT}.wepublish.dev`

  console.log(deploymentMessage)
}

main().catch(error => {
  setFailed(error)
})
