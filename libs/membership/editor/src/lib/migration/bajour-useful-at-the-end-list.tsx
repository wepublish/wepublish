import {IconButton} from '@wepublish/ui/editor'
import {MdDownload, MdSync} from 'react-icons/md'
import {Col, Grid, Header} from 'rsuite'
import {DirectusDownloader} from './directus-downloader'
import {useState} from 'react'
import {RequestCollection} from './base-importer'
import {syncStatusToColor} from './migration-list'
import {UsefulAtTheEnd, UsefulAtTheEndImporter} from './useful-at-the-end-importer'

export function BajourUsefulAtTheEndList(requestCollection: RequestCollection) {
  const [usefulAtTheEnds, setUsefulAtTheEnds] = useState<UsefulAtTheEnd[]>([])
  const [downloadComplete, setDownloadComplete] = useState(false)

  async function downloadUsefulAtTheEnd() {
    const downloader = new DirectusDownloader()
    await downloader.getResource<UsefulAtTheEnd>('the_useful_at_the_end', '*,image.*', items => {
      setUsefulAtTheEnds(prev => [...prev, ...items])
    })
    setDownloadComplete(true)
  }

  async function importUsefulAtTheEnd() {
    for (const usefulAtTheEnd of usefulAtTheEnds) {
      const importer = new UsefulAtTheEndImporter(requestCollection, usefulAtTheEnd)
      await importer.run()
    }
  }

  return (
    <>
      <Header>
        <IconButton
          appearance="primary"
          icon={<MdDownload />}
          onClick={() => downloadUsefulAtTheEnd()}>
          Load "Useful at the End"
        </IconButton>

        {downloadComplete && (
          <IconButton appearance="primary" icon={<MdSync />} onClick={() => importUsefulAtTheEnd()}>
            Import "Useful at the End"
          </IconButton>
        )}
      </Header>

      <Grid fluid style={{marginTop: '2rem'}}>
        {usefulAtTheEnds.map(useful => (
          <Col
            xs={4}
            key={useful.id.toString()}
            style={{backgroundColor: syncStatusToColor(useful.syncStatus)}}>
            <span style={{fontSize: '0.5rem'}}>
              {useful.id.toString()}: {useful.title.substring(0, 25)}
            </span>
          </Col>
        ))}
      </Grid>
    </>
  )
}
