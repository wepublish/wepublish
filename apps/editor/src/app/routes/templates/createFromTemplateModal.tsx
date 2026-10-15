import { TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy, MdNoteAdd, MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Button, Input, InputGroup, Loader, Modal } from 'rsuite';

const Content = styled.div`
  display: grid;
  gap: 12px;
`;

const Options = styled.div`
  display: grid;
  gap: 8px;
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
`;

const Option = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
`;

const BlankOption = styled(Option)`
  margin: 4px 4px 0;
  width: calc(100% - 8px);
`;

const Search = styled(InputGroup)`
  margin: 0 4px;
  width: calc(100% - 8px);
`;

const NoResults = styled.p`
  margin: 0;
  text-align: center;
`;

const SEARCH_THRESHOLD = 5;

type TemplateOption = { id: string; blockTemplate: { name: string } };

export type CreateFromTemplateModalProps<Data> = {
  open: boolean;
  onClose(): void;
  listDocument: TypedDocumentNode<Data, { take?: number | null }>;
  selectTemplates(data: Data | undefined): TemplateOption[] | undefined;
  /** e.g. `/articles/create`; a chosen template is passed as `?templateId=`. */
  createPath: string;
  /** Translation namespace with the `title`, `blank`, `search` and `noResults` keys. */
  i18nPrefix: string;
};

export function CreateFromTemplateModal<Data>({
  open,
  onClose,
  listDocument,
  selectTemplates,
  createPath,
  i18nPrefix,
}: CreateFromTemplateModalProps<Data>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [hasBeenOpened, setHasBeenOpened] = useState(open);

  if (open && !hasBeenOpened) {
    setHasBeenOpened(true);
  }

  const { data, loading } = useQuery(listDocument, {
    variables: { take: 100 },
    skip: !hasBeenOpened,
    fetchPolicy: 'cache-and-network',
  });

  const nodes = selectTemplates(data) ?? [];
  const showSearch = nodes.length > SEARCH_THRESHOLD;
  const query = search.trim().toLowerCase();
  const templates =
    query ?
      nodes.filter(({ blockTemplate }) =>
        blockTemplate.name.toLowerCase().includes(query)
      )
    : nodes;

  const create = (templateId?: string) => {
    onClose();
    navigate(
      templateId ?
        `${createPath}?templateId=${encodeURIComponent(templateId)}`
      : createPath
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      onExited={() => setSearch('')}
      size="sm"
      overflow={false}
    >
      <Modal.Header>
        <Modal.Title>{t(`${i18nPrefix}.title`)}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Content>
          <BlankOption
            appearance="primary"
            onClick={() => create()}
          >
            <MdNoteAdd />
            {t(`${i18nPrefix}.blank`)}
          </BlankOption>

          {showSearch && (
            <Search size="sm">
              <InputGroup.Addon>
                <MdSearch />
              </InputGroup.Addon>
              <Input
                value={search}
                placeholder={t(`${i18nPrefix}.search`)}
                onChange={value => setSearch(value)}
              />
            </Search>
          )}

          <Options>
            {templates.map(({ id, blockTemplate }) => (
              <Option
                key={id}
                appearance="ghost"
                onClick={() => create(id)}
              >
                <MdContentCopy />
                {blockTemplate.name}
              </Option>
            ))}

            {search && !templates.length && (
              <NoResults>{t(`${i18nPrefix}.noResults`)}</NoResults>
            )}

            {loading && !data && <Loader center />}
          </Options>
        </Content>
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={onClose}
          appearance="subtle"
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
