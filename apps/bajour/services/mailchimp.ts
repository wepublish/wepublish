import mailchimp from '@mailchimp/mailchimp_marketing'

const apiKey = process.env.MAILCHIMP_API_KEY
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX

mailchimp.setConfig({
  apiKey,
  server: serverPrefix
})

export default mailchimp
