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
        WEBSITE_CLIENT_URL_PATTERN
    } = process.env

    let deploymentMessage = `<a href="https://github.com/wepublish/wepublish/pull/${PR_NUMBER}">PR ${PR_NUMBER}</a> with branch \`${BRANCH_NAME}\` has been deployed to:
  - Website: ${WEBSITE_URL}
  - Editor: ${EDITOR_URL}
  - Public API: ${API_URL}/v1
  - Private API: ${API_URL}/v1/admin
  - Media: ${MEDIA_SERVER_URL}`

    const ignoreList = ['api-example', 'website-example', 'editor'];
    const files = await readdir(__dirname + '/apps');
    for (const app of files) {
        if (!ignoreList.includes(app)) {
            deploymentMessage += `\n- ${app}: ${WEBSITE_CLIENT_URL_PATTERN.replace('{APP}', app)}`
        }
    }

    console.log(deploymentMessage)
}

main().catch(error => {
    setFailed(error)
})
