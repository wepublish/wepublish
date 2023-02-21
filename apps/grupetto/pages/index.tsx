import {MemberPlansContainer} from '@wepublish/membership/website'
import {BuilderMemberPlansProps, WebsiteBuilderProvider} from '@wepublish/website-builder'
import {useChallengeQuery} from '@wepublish/website/api'

const CustomMemberPlans = ({data, loading}: BuilderMemberPlansProps) => {
  const {data: challenge} = useChallengeQuery()

  if (!data?.memberPlans) {
    return null
  }

  if (!data?.memberPlans.nodes.length) {
    return <div>No memberplans yet</div>
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{__html: challenge?.challenge.challenge}}></div>

      {data.memberPlans.nodes.map(memberPlan => (
        <div key={memberPlan.id}>{memberPlan.name}</div>
      ))}
    </div>
  )
}

export function Index() {
  return (
    <WebsiteBuilderProvider MemberPlans={CustomMemberPlans}>
      <MemberPlansContainer />
    </WebsiteBuilderProvider>
  )
}

export default Index
