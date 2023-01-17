import styled from '@emotion/styled'
import {useVersionInformationQuery} from '@wepublish/editor/api-v2'
import {useEffect, useMemo, useState} from 'react'

import {getApiClientV2} from '../utility'

const StyledVersion = styled.div`
  padding: 5px;
  padding-left: 25px;
`

export function Version() {
  const [version, setVersion] = useState<string | null>(null)

  const client = useMemo(() => getApiClientV2(), [])
  const {data: versionData} = useVersionInformationQuery({client})

  useEffect(() => {
    setVersion(String(versionData?.versionInformation?.version))
  }, [versionData?.versionInformation?.version])

  return (
    <StyledVersion>
      <div>{`v${version}`}</div>
    </StyledVersion>
  )
}

export default Version
