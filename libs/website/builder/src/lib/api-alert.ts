import {ApolloError} from '@apollo/client/errors'
import {AlertProps} from '@wepublish/ui'

export interface BuilderApiAlertProps extends AlertProps {
  error: ApolloError
}
