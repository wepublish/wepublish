import React, {useCallback, useContext, useMemo, useState} from 'react'
import {
  Button,
  Col,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Grid,
  Row,
  SelectPicker,
  Tag,
  TagGroup
} from 'rsuite'
import {isFunctionalUpdate} from '@karma.run/react'
import {
  Link,
  ContentEditRoute,
  RichTextBlock,
  RichTextBlockValue,
  Reference,
  RefSelectPanelDrawer,
  MediaReferenceType
} from '@wepublish/editor'
import {ContentContextEnum, useModelAQuery} from './article/api'
import {ConfigContext} from '@wepublish/editor/src/client/Editorcontext'
import {I18nWrapper} from './i18nWrapper'

export interface ArticleMetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export interface CustomContentValue {
  readonly myString: string
  readonly myStringI18n: {
    [lang: string]: string
  }
  readonly myRichText: RichTextBlockValue
  readonly myRef?: Reference | null
}

export interface CustomContentExampleProps {
  readonly value: CustomContentValue
  readonly onChange: React.Dispatch<React.SetStateAction<CustomContentValue>>
}

export function CustomContentExample({value, onChange}: CustomContentExampleProps) {
  if (!value) {
    return null
  }

  const config = useContext(ConfigContext)
  const [editLang, setEditLang] = useState(config.lang.languages[0].tag)
  const [viewLang, setViewLang] = useState(config.lang.languages[1].tag)

  const {myString, myStringI18n, myRichText, myRef} = value
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        myRichText: isFunctionalUpdate(richText) ? richText(value.myRichText) : richText
      })),
    [onChange]
  )

  const languages = config.lang.languages.map(v => {
    return {
      label: v.tag,
      value: v.tag
    }
  })
  const header = useMemo(() => {
    return (
      <Row className="show-grid">
        <Col xs={10}>
          <SelectPicker
            data={languages}
            value={editLang}
            onChange={setEditLang}
            style={{width: 224}}
          />
        </Col>
        <Col xs={4}>
          <Button
            onClick={() => {
              setEditLang(viewLang)
              setViewLang(editLang)
            }}>
            {'<-->'}
          </Button>
        </Col>
        <Col xs={10}>
          <SelectPicker
            data={languages}
            value={viewLang}
            onChange={setViewLang}
            style={{width: 224}}
          />
        </Col>
      </Row>
    )
  }, [viewLang, editLang])

  let ref = null
  if (myRef) {
    const revSummary = `Type: ${myRef.contentType} Id: ${myRef.recordId}`
    ref = (
      <TagGroup>
        <Tag
          closable
          onClose={() => {
            onChange?.({...value, myRef: null})
          }}>
          {revSummary}
        </Tag>
      </TagGroup>
    )
  } else {
    ref = (
      <Button
        appearance="default"
        active
        onClick={teaser => {
          setChooseModalOpen(true)
        }}>
        reference to
      </Button>
    )
  }

  return (
    <>
      <Grid>
        {header}

        <Row>
          <br></br>
        </Row>

        <I18nWrapper value={myString}>
          <ControlLabel>myString</ControlLabel>
          <FormControl value={myString} onChange={myString => onChange?.({...value, myString})} />
        </I18nWrapper>

        <I18nWrapper value={myStringI18n[editLang]} display={myStringI18n[viewLang]}>
          <ControlLabel>Evaluation Body Name</ControlLabel>
          <FormControl
            value={myStringI18n[editLang]}
            onChange={val =>
              onChange?.({...value, myStringI18n: {...myStringI18n, [editLang]: val}})
            }
          />
        </I18nWrapper>

        <I18nWrapper>
          <ControlLabel>myRichText</ControlLabel>
          <RichTextBlock
            value={myRichText}
            onChange={handleRichTextChange}
            config={{
              bold: true,
              italic: true,
              url: true,
              ref: {
                modelA: {scope: ContentContextEnum.Local},
                modelB: {scope: ContentContextEnum.Local},
                [MediaReferenceType]: {scope: ContentContextEnum.Local}
              }
            }}
          />
        </I18nWrapper>

        <I18nWrapper>
          <ControlLabel>myRef</ControlLabel>
          {ref}
        </I18nWrapper>
      </Grid>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <RefSelectPanelDrawer
          config={{
            modelA: {scope: ContentContextEnum.Local},
            modelB: {scope: ContentContextEnum.Local},
            [MediaReferenceType]: {scope: ContentContextEnum.Local}
          }}
          onClose={() => setChooseModalOpen(false)}
          onSelectRef={ref => {
            setChooseModalOpen(false)
            onChange?.({...value, myRef: ref})
          }}
        />
      </Drawer>
    </>
  )
}

export function ModelBView({value, onChange}: CustomContentExampleProps) {
  if (!value) {
    return null
  }
  const {myString, myRichText, myRef} = value
  const {data} = useModelAQuery({
    skip: myRef?.record || !myRef?.recordId,
    variables: {
      id: myRef?.recordId!
    }
  })
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        myRichText: isFunctionalUpdate(richText) ? richText(value.myRichText) : richText
      })),
    [onChange]
  )

  let ref = null
  if (myRef) {
    const referenceSummary = (
      <Link route={ContentEditRoute.create({type: myRef.contentType, id: myRef.recordId})}>
        Type: {myRef.contentType} Id: {myRef.recordId}
      </Link>
    )
    let referencePreview: any = null
    if (data?.content.modelA.read.title) {
      const {title, content} = data.content.modelA.read
      referencePreview = `${title} ${content?.myString}`
    }
    ref = (
      <TagGroup>
        <Tag
          closable
          onClose={() => {
            onChange?.({...value, myRef: null})
          }}>
          {referenceSummary}
          <br />
          {referencePreview}
        </Tag>
      </TagGroup>
    )
  } else {
    ref = (
      <Button
        appearance="default"
        active
        onClick={teaser => {
          setChooseModalOpen(true)
        }}>
        reference to
      </Button>
    )
  }

  return (
    <>
      <Form fluid={true} style={{width: '100%'}}>
        <FormGroup>
          <ControlLabel>myRef</ControlLabel>
          {ref}
        </FormGroup>
        <FormGroup>
          <ControlLabel>myString</ControlLabel>
          <FormControl
            componentClass="textarea"
            rows={3}
            value={myString}
            onChange={myString => onChange?.({...value, myString})}
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>myRichText</ControlLabel>
          <RichTextBlock
            value={myRichText}
            onChange={handleRichTextChange}
            config={{
              ref: {
                modelA: {scope: ContentContextEnum.Local}
              }
            }}
          />
        </FormGroup>
      </Form>

      <Drawer show={isChooseModalOpen} size={'sm'} onHide={() => setChooseModalOpen(false)}>
        <RefSelectPanelDrawer
          config={{
            modelA: {scope: ContentContextEnum.Local}
          }}
          onClose={() => setChooseModalOpen(false)}
          onSelectRef={ref => {
            setChooseModalOpen(false)
            onChange?.({...value, myRef: ref})
          }}
        />
      </Drawer>
    </>
  )
}
