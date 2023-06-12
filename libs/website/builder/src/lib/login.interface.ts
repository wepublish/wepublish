import {MutationResult} from '@apollo/client'
import {LoginWithCredentialsMutation, LoginWithEmailMutation} from '@wepublish/website/api'

export type BuilderLoginFormProps = {
  className?: string
  subscriptionPath: string

  loginWithEmail: Pick<MutationResult<LoginWithEmailMutation>, 'data' | 'loading' | 'error'>
  onSubmitLoginWithEmail: (email: string) => void

  loginWithCredentials: Pick<
    MutationResult<LoginWithCredentialsMutation>,
    'data' | 'loading' | 'error'
  >
  onSubmitLoginWithCredentials: (email: string, password: string) => void
}
