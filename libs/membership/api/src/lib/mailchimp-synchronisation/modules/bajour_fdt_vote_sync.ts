import {Config, CustomModuleConfig} from '../main'

type MAILCHIMP_REPORT = {
  id: string
  campaign_title: string
  send_time: string
}

type MAILCHIMP_REPORT_URL = {
  id: string
  url: string
}
type MAILCHIMP_REPORT_URL_CLICK = {
  email_address: string
}

async function getClicks(
  mailchimp: any,
  report: MAILCHIMP_REPORT,
  url: MAILCHIMP_REPORT_URL
): Promise<MAILCHIMP_REPORT_URL_CLICK[]> {
  let clicks: MAILCHIMP_REPORT_URL_CLICK[] = []
  let clicksLastResponse: MAILCHIMP_REPORT_URL_CLICK[] = []
  let offset = 0

  // Get user data of people who have klicked
  while (clicksLastResponse.length > 0 || offset === 0) {
    const response = await await mailchimp.reports.getSubscribersInfo(report.id, url.id, {
      count: 1000,
      offset: offset
    })
    clicksLastResponse = response.members
    clicks = clicks.concat(clicksLastResponse)
    offset = offset + 1000
  }
  return clicks
}

export async function execute(
  mailchimp: any,
  config: Config,
  costumModuleConfig: CustomModuleConfig,
  Sentry: any
) {
  const mergeFieldPoolId = costumModuleConfig.properties.find(
    prop => prop.key === 'mergeFieldPoolId'
  )
  if (!mergeFieldPoolId) {
    Sentry.captureMessage('Fdt missing mergeFieldPoolId in config')
    return
  }

  // Get all reports for last 30h
  const responseReports = await mailchimp.reports.getAllCampaignReports({
    since_send_time: new Date(new Date().getTime() - 30 * 60 * 60 * 1000)
  })
  const reports: MAILCHIMP_REPORT[] = responseReports.reports
  const sortedReports = reports.sort(function (a, b) {
    return new Date(a.send_time).getTime() - new Date(b.send_time).getTime()
  })

  for (const report of sortedReports) {
    // Get all urls from report
    const responseUrls = await mailchimp.reports.getCampaignClickDetails(report.id, {count: 1000})
    const regex = new RegExp('https:\\/\\/blocks.bajour.ch', 'g')
    const urls_clicked: MAILCHIMP_REPORT_URL[] = responseUrls.urls_clicked

    // Filter for urls that are from pools
    let urls = urls_clicked.filter(clicked => clicked.url.match(regex))

    Sentry.captureMessage(
      `${report.campaign_title}: Out of ${urls_clicked.length} urls ${urls.length} are bajour blocks urls`
    )

    for (const url of urls) {
      // Get data from the url
      const urlParams = new URL(url.url)
      const poolId = urlParams.searchParams.get('pollId')
      const answerId = urlParams.searchParams.get('answerId')

      if (!poolId || !answerId) {
        Sentry.captureMessage(`${report.campaign_title}: skiping url because its not a pool url`)
        continue
      }

      const clicks = await getClicks(mailchimp, report, url)
      for (const click of clicks) {
        const userObj = {
          merge_fields: {
            [mergeFieldPoolId.value]: poolId
          }
        }
        try {
          await mailchimp.lists.updateListMember(
            config.mailchimpListID,
            click.email_address,
            userObj,
            {
              skip_merge_validation: true
            }
          )
        } catch (e) {
          console.log(e)
          Sentry.captureMessage(
            `fdt: Failed to update user ${JSON.stringify(userObj)} with error: ${e}`
          )
        }
      }
      Sentry.captureMessage(
        `${report.campaign_title}: Synced ${clicks.length} clicks for poll ${poolId} with vote ${answerId}`
      )
    }
  }
}
