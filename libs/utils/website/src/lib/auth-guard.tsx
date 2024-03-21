import {useUser} from '@wepublish/website'
import {setCookie} from 'cookies-next'
import {add} from 'date-fns'
import {useRouter} from 'next/router'
import {ComponentType, Fragment, PropsWithChildren} from 'react'

export const IntendedRouteStorageKey = 'auth.intended'
export const IntendedRouteExpiryInSeconds = 2 * 60

const AuthGuard = ({children}: PropsWithChildren) => {
  const router = useRouter()
  const {hasUser} = useUser()

  if (!hasUser) {
    setCookie(IntendedRouteStorageKey, router.asPath, {
      expires: add(new Date(), {
        seconds: IntendedRouteExpiryInSeconds
      })
    })

    router.push('/login')

    return <Fragment />
  }

  return <>{children}</>
}

export const withAuthGuard = <P extends object>(Cmp: ComponentType<P>) =>
  function AuthGuardWrapper(props: P) {
    return (
      <AuthGuard>
        <Cmp {...props} />
      </AuthGuard>
    )
  }
