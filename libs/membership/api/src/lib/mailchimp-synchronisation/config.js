const config = {
  mailchimpListID: process.env.MAILCHIMP_LIST_ID,
  mailchimpToken: process.env.MAILCHIMP_TOKEN,
  mailchimpDC: process.env.MAILCHIMP_DC,
  wepUser: process.env.WEP_USER,
  wepPassword: process.env.WEP_PW,
  wepApiUrl: process.env.WEP_URL,
  personalInfoFields: {
    firstName: {
      mergeField: 'MMERGE1'
    },
    lastName: {
      mergeField: 'MMERGE2'
    }
  },
  subscriptions: [
    {
      searchKey: 'wir-retten-zueri-member',
      mergeField: 'MMERGE4'
    },
    {
      searchKey: 'tsri-member',
      mergeField: 'MMERGE6'
    }
  ],
  retarget: {
    days: 35,
    mergeField: 'MMERGE5'
  },
  hasSubscription: {
    mergeField: 'MMERGE3'
  }
}
module.exports = config
