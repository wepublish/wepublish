import {PageContainer} from '@wepublish/page/website'
import {CrowdfundingChart} from '../src/crowdfunding-chart'
import {Donate} from '../src/donate'
import {Intro} from '../src/intro'

export function Index() {
  return (
    <>
      <Intro />

      <CrowdfundingChart />

      <Donate />

      <PageContainer slug="" />
    </>
  )
}

export default Index
