import {IconButton} from '@wepublish/ui/editor'
import {MdDownload, MdSync} from 'react-icons/md'
import {Col, Grid, Header} from 'rsuite'
import {DirectusDownloader} from './directus-downloader'
import {useState} from 'react'
import {PersonOfTheDay, PersonOfTheDayImporter} from './person-of-the-day-importer'
import {RequestCollection} from './base-importer'
import {syncStatusToColor} from './migration-list'

export function BajourPersonOfTheDayList(requestCollection: RequestCollection) {
  const [peopleOfTheDay, setPeopleOfTheDay] = useState<PersonOfTheDay[]>([])
  const [downloadComplete, setDownloadComplete] = useState(false)

  async function downloadPeopleOfTheDay() {
    const downloader = new DirectusDownloader()
    await downloader.getResource<PersonOfTheDay>('Person_of_the_day', '*,image.*', item => {
      setPeopleOfTheDay(prev => [...prev, ...item])
    })
    setDownloadComplete(true)
  }

  async function importPeopleOfTheDay() {
    for (const person of peopleOfTheDay) {
      const importer = new PersonOfTheDayImporter(requestCollection, person)
      await importer.run()
    }
  }

  return (
    <>
      <Header>
        <IconButton
          appearance="primary"
          icon={<MdDownload />}
          onClick={() => downloadPeopleOfTheDay()}>
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
