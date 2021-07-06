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
  const incomingWebhook = process.env.SLACK_WEBHOOK_URL
  const webhook = new IncomingWebhook(incomingWebhook);

  const GITHUB_REF_SHORT = slugify(process.env.BRANCH_NAME)

  webhook.send({
    text: `We.Publish Feature Deployment successful: ${GITHUB_REF_SHORT}`
  })
}


main().catch((error) => {
  console.log('error', error)
})
