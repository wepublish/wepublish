// eslint-disable-next-line @typescript-eslint/no-var-requires
const { IncomingWebhook } = require('@slack/webhook');

function slugify(text, separator = "-") {
  return text
    .toString()
    .normalize('NFD')                   // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, '')   // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')   // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, separator);
};

async function main() {
  const {SLACK_WEBHOOK_URL, BRANCH_NAME, PR_NUMBER} = process.env
  const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

  const GITHUB_REF_SHORT = slugify(BRANCH_NAME)

  await webhook.send({
    text: `We.Publish PR Deployment :white_check_mark:. 
<https://github.com/wepublish/wepublish/pull/${PR_NUMBER}|PR ${PR_NUMBER}> with branch \`${BRANCH_NAME}\` has been deployed to:
Website: https://${GITHUB_REF_SHORT}.wepublish.dev
Editor: https://editor.${GITHUB_REF_SHORT}.wepublish.dev
API: https://api.${GITHUB_REF_SHORT}.wepublish.dev
Media: https://media.${GITHUB_REF_SHORT}.wepublish.dev`
  })
}


main().catch((error) => {
  console.log('error', error)
})
