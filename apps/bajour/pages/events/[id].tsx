import {Container as MuiContainer, styled} from '@mui/material'
import {EventContainer} from '@wepublish/website'
import {useRouter} from 'next/router'

const Container = styled(MuiContainer)`
  padding: ${({theme}) => theme.spacing(5)};
`

export default function EventById() {
  const {
    query: {id}
  } = useRouter()

  return (
    <Container maxWidth="md" fixed>
      <main>
        <EventContainer id={id as string} />
      </main>
    </Container>
  )
}
