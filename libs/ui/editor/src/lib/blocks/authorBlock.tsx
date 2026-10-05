import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Panel as RPanel } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { PlaceholderInput } from '../atoms/placeholderInput';
import { AuthorSelectPicker } from '../panel/authorSelectPicker';
import { AuthorBlockValue } from '.';

const Author = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Content = styled.div`
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 12px;
  height: 100%;
  padding: 24px;
`;

const Name = styled.div`
  font-weight: bold;
  text-align: center;
`;

const JobTitle = styled.div`
  text-align: center;
`;

const Panel = styled(RPanel)`
  display: grid;
  min-height: 200px;
  width: 100%;
`;

const PickerWrapper = styled.div`
  width: 100%;
  max-width: 320px;
`;

export const AuthorBlock = ({
  value,
  onChange,
  autofocus,
}: BlockProps<AuthorBlockValue>) => {
  const { t } = useTranslation();
  const { author } = value;

  return (
    <Author>
      <Panel bodyFill>
        <PlaceholderInput onAddClick={() => undefined}>
          <Content>
            {author && (
              <>
                <Name>{author.name}</Name>
                {author.jobTitle && <JobTitle>{author.jobTitle}</JobTitle>}
              </>
            )}

            <PickerWrapper>
              <AuthorSelectPicker
                name="author"
                selectedAuthor={author}
                setSelectedAuthor={selectedAuthor =>
                  onChange({ ...value, author: selectedAuthor })
                }
              />
            </PickerWrapper>

            {!author && <div>{t('blocks.author.placeholder')}</div>}
          </Content>
        </PlaceholderInput>
      </Panel>
    </Author>
  );
};
