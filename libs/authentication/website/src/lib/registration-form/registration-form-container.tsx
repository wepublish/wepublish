import {useChallengeQuery, useRegisterMutation} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useUser} from '../session.context'

export type RegistrationFormContainerProps = BuilderContainerProps

export function RegistrationFormContainer({className}: RegistrationFormContainerProps) {
  const {RegistrationForm} = useWebsiteBuilder()
  const {setToken} = useUser()
  const [register, registerData] = useRegisterMutation({
    onError: () => challenge.refetch(),
    onCompleted(data) {
      setToken({
        createdAt: data.registerMember.session.createdAt,
        expiresAt: data.registerMember.session.expiresAt,
        token: data.registerMember.session.token
      })
    }
  })
  const challenge = useChallengeQuery()

  return (
    <RegistrationForm
      className={className}
      challenge={challenge}
      register={registerData}
      onRegister={variables =>
        register({
          variables
        })
      }
    />
  )
}
