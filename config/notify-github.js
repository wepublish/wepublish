const {setFailed} = require('@actions/core')
const {readdir} = require("fs/promises");

async function main() {
    const {
        BRANCH_NAME,
        PR_NUMBER,
        API_URL,
        EDITOR_URL,
        WEBSITE_URL,
        MEDIA_SERVER_URL,
        PROJECTS,
        PROJECT_URL_SUFFIX,
    } = process.env

    let deploymentMessage = `<a href="https://github.com/wepublish/wepublish/pull/${PR_NUMBER}">PR ${PR_NUMBER}</a> with branch \`${BRANCH_NAME}\` has been deployed to:

<h2>Main</h2>

  - Website: ${WEBSITE_URL}
  - Editor: ${EDITOR_URL}
  - Public API: ${API_URL}/v1
  - Private API: ${API_URL}/v1/admin
  - Media: ${MEDIA_SERVER_URL}

<h2>Projects:</h2>
`

    const projects = JSON.parse(PROJECTS);
    for (const project of projects) {
        deploymentMessage += `
  - ${project}: https://${project}${PROJECT_URL_SUFFIX}`
    }
    console.log(deploymentMessage)
}

main().catch(error => {
    setFailed(error)
})
