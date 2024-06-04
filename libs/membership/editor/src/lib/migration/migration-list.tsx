import {Accordion, AccordionDetails, AccordionSummary} from '@mui/material'
import {createCheckedPermissionComponent} from '@wepublish/ui/editor'
import {Container} from 'rsuite'
import {BajourPersonOfTheDayList} from './bajour-person-of-the-day-list'
import {MdExpand} from 'react-icons/md'
import {
  useCreateArticleMutation,
  usePublishArticleMutation,
  useUploadImageMutation,
  useImageListLazyQuery,
  useArticleListLazyQuery,
  useArticleLazyQuery
} from '@wepublish/editor/api'
import {BajourUsefulAtTheEndList} from './bajour-useful-at-the-end-list'

export function syncStatusToColor(num: number): string {
  if (num === 25) {
    return 'orange'
  }
  if (num === 50) {
    return 'yellow'
  }
  if (num === 75) {
    return 'lightgreen'
  }
  if (num === 100) {
    return 'green'
  }
  return 'white'
}

function MigrationList() {
  const [createArticle] = useCreateArticleMutation()
  const [publishArticle] = usePublishArticleMutation()
  const [uploadImage] = useUploadImageMutation()
  const [getExistingImages] = useImageListLazyQuery()
  const [getExistingArticles] = useArticleListLazyQuery()
  const [getExistingArticle] = useArticleLazyQuery()

  const requestCollection = {
    createArticle,
    publishArticle,
    uploadImage,
    getExistingImages,
    getExistingArticles,
    getExistingArticle
  }

  return (
    <>
      <Container>
        <h1>Migrator</h1>
        <Accordion>
          <AccordionSummary expandIcon={<MdExpand />}>Bajour - Person of the Day</AccordionSummary>
          <AccordionDetails>
            <BajourPersonOfTheDayList {...requestCollection} />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<MdExpand />}>
            Bajour - The useful at the End
          </AccordionSummary>
          <AccordionDetails>
            <BajourUsefulAtTheEndList {...requestCollection} />
          </AccordionDetails>
        </Accordion>
      </Container>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLES',
  'CAN_GET_ARTICLE',
  'CAN_CREATE_ARTICLE',
  'CAN_DELETE_ARTICLE',
  'CAN_GET_ARTICLE_PREVIEW_LINK'
])(MigrationList)
export {CheckedPermissionComponent as MigrationList}
