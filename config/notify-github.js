const {setFailed} = require('@actions/core')

async function main() {
    const {BRANCH_NAME, PR_NUMBER, API_URL, EDITOR_URL, WEBSITE_URL, MEDIA_SERVER_URL} = process.env

    const deploymentMessage = `<a href="https://github.com/wepublish/wepublish/pull/${PR_NUMBER}">PR ${PR_NUMBER}</a> with branch \`${BRANCH_NAME}\` has been deployed to:
  - Website: ${WEBSITE_URL}
  - Editor: ${EDITOR_URL}
  - Public API: ${API_URL}/v1
  - Private API: ${API_URL}/v1/admin
  - Media: ${MEDIA_SERVER_URL}`

    console.log(deploymentMessage)
}

main().catch(error => {
    setFailed(error)
})
