import {RegistrationFormContainer, useUser} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useEffect} from 'react'

export default function SignUp() {
  const {hasUser} = useUser()
  const router = useRouter()

  useEffect(() => {
    if (hasUser) {
      router.push('/')
    }
  }, [router, hasUser])

  return <RegistrationFormContainer />
}
