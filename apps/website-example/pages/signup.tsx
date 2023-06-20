import {styled} from '@mui/material'
import {RegistrationFormContainer, useUser, useWebsiteBuilder} from '@wepublish/website'
import {useRouter} from 'next/router'
import {useEffect} from 'react'

const SignupWrapper = styled('div')`
  display: grid;
  justify-content: center;
  gap: ${({theme}) => theme.spacing(3)};
`

export default function SignUp() {
  const {hasUser} = useUser()
  const router = useRouter()
  const {
    elements: {H3}
  } = useWebsiteBuilder()

  useEffect(() => {
    if (hasUser) {
      router.replace('/')
    }
  }, [router, hasUser])

  return (
    <SignupWrapper>
      <H3 component="h1">Registriere dich noch heute</H3>

      <RegistrationFormContainer />
    </SignupWrapper>
  )
}
