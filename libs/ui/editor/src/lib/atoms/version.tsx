import styled from '@emotion/styled';
import { useVersionInformationQuery } from '@wepublish/editor/api';
import { useEffect, useState } from 'react';

const StyledVersion = styled.div`
  padding: 5px;
  padding-left: 25px;
`;

export function Version() {
  const [version, setVersion] = useState<string | null>(null);

  const { data: versionData } = useVersionInformationQuery();

  useEffect(() => {
    setVersion(String(versionData?.versionInformation?.version));
  }, [versionData?.versionInformation?.version]);

  return (
    <StyledVersion>
      <div>{`${version}`}</div>
    </StyledVersion>
  );
}

export default Version;
