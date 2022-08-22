import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import {FlexboxGrid} from 'rsuite'

export function PollEditView() {
  const [id, setId] = useState<string | undefined>(undefined)
  const params = useParams()

  useEffect(() => {
    if (params?.id) {
      setId(params.id)
    }
  }, [params?.id])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>Umfrage {id}</h2>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
