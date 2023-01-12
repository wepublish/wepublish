import styled from '@emotion/styled'
import {useEffect, useMemo, useState} from 'react'

import {useVersionInformationQuery} from '../api/v2'
import {getApiClientV2} from '../utility'

export interface VersionProps {}

const StyledVersion = styled.div`
  padding: 5px;
  padding-left: 25px;
`

export function Version(props: VersionProps) {
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
