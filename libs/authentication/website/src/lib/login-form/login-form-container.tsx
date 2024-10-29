import {useLoginWithCredentialsMutation, useLoginWithEmailMutation} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useUser} from '../session.context'

export type LoginFormContainerProps = BuilderContainerProps & {
  afterLoginCallback?: () => void
}

export function LoginFormContainer({className, afterLoginCallback}: LoginFormContainerProps) {
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

  return (
    <LoginForm
      className={className}
      onSubmitLoginWithCredentials={(email, password) => {
        loginWithCredentials({
          variables: {email, password}
        })

        if (afterLoginCallback) {
          afterLoginCallback()
        }
      }}
      loginWithCredentials={withCredentials}
      onSubmitLoginWithEmail={email => {
        loginWithEmail({
          variables: {email}
        })

        if (afterLoginCallback) {
          afterLoginCallback()
        }
      }}
      loginWithEmail={withEmail}
    />
  )
}
