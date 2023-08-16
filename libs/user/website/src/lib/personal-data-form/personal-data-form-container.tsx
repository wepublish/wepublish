import {MutationResult, QueryResult} from '@apollo/client'
import {
  ChallengeQuery,
  RegisterMutation,
  useChallengeQuery,
  useRegisterMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect} from 'react'
import {useUser} from '../session.context'

export type PersonalDataFormContainerProps = {
  onChallengeQuery?: (
    queryResult: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void

  onRegister?: (
    mutationResult: Pick<MutationResult<RegisterMutation>, 'data' | 'loading' | 'error'>
  ) => void
} & BuilderContainerProps

export function PersonalDataFormContainer({
  onRegister,
  onChallengeQuery,
  className
}: PersonalDataFormContainerProps) {
  const {PersonalDataForm} = useWebsiteBuilder()
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

  useEffect(() => {
    if (registerData.called) {
      onRegister?.(registerData)
    }
  }, [registerData, onRegister])

  useEffect(() => {
    onChallengeQuery?.(challenge)
  }, [challenge, onChallengeQuery])

  return (
    <PersonalDataForm
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
