const {setFailed} = require('@actions/core')

async function main() {
  const {
    BRANCH_NAME,
    PR_NUMBER,
    API_URL,
    EDITOR_URL,
    WEBSITE_URL,
    MEDIA_SERVER_URL,
    HAS_LABEL,
  } = process.env

  let deploymentMessage = ''

  if (HAS_LABEL === 'true') {
    deploymentMessage = `<a href="https://github.com/wepublish/wepublish/pull/${PR_NUMBER}">PR ${PR_NUMBER}</a> with branch \`${BRANCH_NAME}\` has been deployed to:

<h2>Main</h2>

  - Website: ${WEBSITE_URL}
  - Editor: ${EDITOR_URL}
  - API: ${API_URL}/v1
  - Media: ${MEDIA_SERVER_URL}

<h2>Projects:</h2>

To deploy frontend create a label with the prefix "review_" followed by the review runner number and the project name eg. review_01_bajour.
`
  } else {
    deploymentMessage = `<a href="https://github.com/wepublish/wepublish/pull/${PR_NUMBER}">PR ${PR_NUMBER}</a> with branch \`${BRANCH_NAME}\`

<h2>No review build running</h2>

There is currently no review build deployed for this PR.

<h3>Want to deploy a review build?</h3>

1. Check the <a href="https://wepublish-media.slack.com/lists/T0154B6F1C7/F0AJKBUT9EU">Slack sheet</a> to see which review instance is currently unused
2. Add or select a label to this PR with the format: \`review_<number>_<project>\`

<b>Example:</b> \`review_01_bajour\`

Where:
  - \`<number>\` is the review runner number (e.g. \`01\`, \`02\`, ...)
  - \`<project>\` is the project name (e.g. \`bajour\`, \`tsri\`, ...)
`
  }

  console.log(deploymentMessage)
}

main().catch(error => {
  setFailed(error)
})