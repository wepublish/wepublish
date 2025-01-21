import {IconButton} from '@wepublish/ui/editor'
import {MdDownload, MdSync} from 'react-icons/md'
import {Col, Grid, Header} from 'rsuite'
import {DirectusDownloader} from './directus-downloader'
import {useState} from 'react'
import {PersonOfTheDay, PersonOfTheDayImporter} from './person-of-the-day-importer'
import {RequestCollection} from './base-importer'
import {syncStatusToColor} from './migration-list'
import {TextField} from '@mui/material'
import styled from '@emotion/styled'

export function BajourPersonOfTheDayList(requestCollection: RequestCollection) {
  const [peopleOfTheDay, setPeopleOfTheDay] = useState<PersonOfTheDay[]>([])
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function downloadPeopleOfTheDay(username: string, password: string) {
    const downloader = new DirectusDownloader(username, password)
    await downloader.getResource<PersonOfTheDay>('Person_of_the_day', '*,image.*', item => {
      setPeopleOfTheDay(prev => [...prev, ...item])
    })
    setDownloadComplete(true)
  }

  async function importPeopleOfTheDay() {
    for (const person of peopleOfTheDay) {
      const importer = new PersonOfTheDayImporter(username, password, requestCollection, person)
      await importer.run()
    }
  }

  return (
    <>
      <Header>
        <TextField
          label="Directus-Benutzername"
          type="text"
          onChange={e => setUsername(e.target.value)}
        />
        <TextField
          label="Directus-Passwort"
          type="password"
          onChange={e => setPassword(e.target.value)}
        />
        <IconButton
          appearance="primary"
          icon={<MdDownload />}
          onClick={() => downloadPeopleOfTheDay(username, password)}>
          Load "People of the Day"
        </IconButton>

        {downloadComplete && (
          <IconButton appearance="primary" icon={<MdSync />} onClick={() => importPeopleOfTheDay()}>
            Import "People of the Day"
          </IconButton>
        )}
      </Header>

      <Grid fluid style={{marginTop: '2rem'}}>
        {peopleOfTheDay.map(person => (
          <Col
            xs={4}
            key={person.id.toString()}
            style={{backgroundColor: syncStatusToColor(person.syncStatus)}}>
            <span style={{fontSize: '0.5rem'}}>
              {person.id.toString()}: {person.name.substring(0, 25)}
            </span>
          </Col>
        ))}
      </Grid>
    </>
  )
}
