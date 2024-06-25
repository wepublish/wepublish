import {ApolloError} from '@apollo/client/errors'
import {useMemo} from 'react'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {ErrorCode} from '@wepublish/utils'
import {AlertProps} from '@wepublish/ui'

/**
 * This function is intended to replace with standard i18n translation functions.
 * @param errorCode
 */
export function translateApolloErrorCode(errorCode?: ErrorCode): string | undefined {
  if (!errorCode) return
  switch (errorCode) {
    case ErrorCode.EmailAlreadyInUse:
      return 'Es besteht bereits ein Konto mit dieser E-mail.'
    case ErrorCode.ChallengeFailed:
      return 'Die Rechenaufgabe des Spam-Schutz wurde nicht korrekt gelöst. Bitte versuch es nochmals.'
    default:
      return undefined
  }
}

export interface ClientErrorHandlerProps extends AlertProps {
  error: ApolloError
}

/**
 * This component wraps the Website Builders Alert component to explicitly handle Apollo errors coming from the api.
 * The component retrieves the apollo error code from the apollo error and assigns an appropriate message for the user.
 * @param error
 * @param props
 * @constructor
 */
export function ApolloErrorAlert({error, ...props}: ClientErrorHandlerProps) {
  const {
    elements: {Alert, Link}
  } = useWebsiteBuilder()

  const apolloErrorCode = useMemo<ErrorCode | undefined>(() => {
    return error.graphQLErrors?.at(0)?.extensions['code'] as ErrorCode
  }, [error])

  const errorMessage = useMemo<string>(() => {
    return translateApolloErrorCode(apolloErrorCode) || error.message
  }, [apolloErrorCode])

  return (
    <Alert {...props}>
      {errorMessage}

      {apolloErrorCode === ErrorCode.EmailAlreadyInUse && (
        <>
          <span>&nbsp;</span>
          <Link href="/login">Bitte einloggen</Link>
        </>
      )}
    </Alert>
  )
}
