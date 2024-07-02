import {useMemo} from 'react'
import {Alert} from '@mui/material'
import {ErrorCode} from '@wepublish/errors'
import {BuilderApiAlertProps, useWebsiteBuilder} from '@wepublish/website/builder'

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

/**
 * This component wraps the Website Builders Alert component to explicitly handle Apollo errors coming from the api.
 * The component retrieves the apollo error code from the apollo error and assigns an appropriate message for the user.
 * @param error
 * @param props
 * @constructor
 */
export function ApiAlert({error, ...props}: BuilderApiAlertProps) {
  const {
    elements: {Link}
  } = useWebsiteBuilder()

  const apolloErrorCode = useMemo<ErrorCode | undefined>(() => {
    return error.graphQLErrors?.at(0)?.extensions?.code as ErrorCode
  }, [error])

  const errorMessage = useMemo<string>(() => {
    return translateApolloErrorCode(apolloErrorCode) || error.message
  }, [apolloErrorCode, error])

  return (
    <Alert {...props}>
      {errorMessage}

      {apolloErrorCode === ErrorCode.EmailAlreadyInUse && (
        <>
          <span>&nbsp;</span>
          <Link href={'/login'}>{'Bitte einloggen'}</Link>
        </>
      )}
    </Alert>
  )
}
