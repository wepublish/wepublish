import {MutationResult} from '@apollo/client'
import {
  LoginWithCredentialsMutation,
  LoginWithEmailMutation,
  useLoginWithCredentialsMutation,
  useLoginWithEmailMutation
} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  BuilderLoginFormProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useEffect} from 'react'
import {useUser} from '../session.context'

export type LoginFormContainerProps = Pick<BuilderLoginFormProps, 'subscriptionPath'> & {
  onLoginWithEmail?: (
    mutationResult: Pick<MutationResult<LoginWithEmailMutation>, 'data' | 'loading' | 'error'>
  ) => void

  onLoginWithCredentials?: (
    mutationResult: Pick<MutationResult<LoginWithCredentialsMutation>, 'data' | 'loading' | 'error'>
  ) => void
} & BuilderContainerProps

export function LoginFormContainer({
  onLoginWithEmail,
  onLoginWithCredentials,
  subscriptionPath,
  className
}: LoginFormContainerProps) {
  const {LoginForm} = useWebsiteBuilder()
  const {setToken} = useUser()
  const [loginWithEmail, withEmail] = useLoginWithEmailMutation()
  const [loginWithCredentials, withCredentials] = useLoginWithCredentialsMutation({
    onCompleted(data) {
      setToken({
        createdAt: data.createSession.createdAt,
        expiresAt: data.createSession.expiresAt,
        token: data.createSession.token
      })
    }
  })

  useEffect(() => {
    onLoginWithCredentials?.(withCredentials)
  }, [withCredentials, onLoginWithCredentials])

  useEffect(() => {
    onLoginWithEmail?.(withEmail)
  }, [withEmail, onLoginWithEmail])

  return (
    <LoginForm
      subscriptionPath={subscriptionPath}
      className={className}
      onSubmitLoginWithCredentials={(email, password) => {
        loginWithCredentials({
          variables: {email, password}
        })
      }}
      loginWithCredentials={withCredentials}
      onSubmitLoginWithEmail={email => {
        loginWithEmail({
          variables: {email}
        })
      }}
      loginWithEmail={withEmail}
    />
  )
}
