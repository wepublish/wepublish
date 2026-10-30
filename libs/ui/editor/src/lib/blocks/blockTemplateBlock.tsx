import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  BlockTemplateDocument,
  BlockTemplateListDocument,
  FullBlockFragment,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdOutput, MdRefresh } from 'react-icons/md';

import { BlockMapType, BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { ConfirmActionModal } from '../atoms/notification/confirmActionModal';
import { BlockMap } from './blockMap';
import { blockForQueryBlock, BlockTemplateBlockValue } from './types';

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Picker = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
  margin: ${({ theme }) => theme.spacing(-1, 0, 0, -1)};

  > * {
    flex-shrink: 0;
    white-space: nowrap;
  }
`;

const Preview = styled.div`
  container-type: inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};
  pointer-events: none;
  user-select: none;
`;

const PreviewItem = styled(Card)`
  padding: 0;
  background-color: ${({ theme }) => theme.vars.palette.background.default};
`;

const PreviewLabel = styled.div`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.vars.palette.divider};
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const PreviewBlock = styled.div`
  min-width: 0;
  overflow: hidden;
  padding: 12px;

  @container (max-width: 520px) {
    zoom: 0.6;
  }
`;

export const BlockTemplateBlock = ({
  value: { template },
  onChange,
  onReplace,
  disabled,
}: BlockProps<BlockTemplateBlockValue>) => {
  const { t } = useTranslation();
  const blockMap = BlockMap as BlockMapType;
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { data, loading, refetch } = useQuery(BlockTemplateListDocument, {
    variables: { take: 100 },
    fetchPolicy: 'cache-and-network',
  });

  const templates = useMemo(
    () => data?.blockTemplates.nodes ?? [],
    [data?.blockTemplates.nodes]
  );

  const { data: templateData } = useQuery(BlockTemplateDocument, {
    variables: { id: template?.id ?? '' },
    skip: !template?.id,
    fetchPolicy: 'cache-and-network',
  });

  const fullTemplate =
    templates.find(({ id }) => id === template?.id) ??
    templateData?.blockTemplate;
  const selectedTemplate = fullTemplate ?? template;

  const blocks = useMemo(
    () =>
      (fullTemplate?.blocks ?? []).map(block =>
        blockForQueryBlock(block as FullBlockFragment)
      ),
    [fullTemplate]
  );

  return (
    <Wrapper>
      <Picker>
        <TextField
          select
          label={t('blocks.blockTemplate.select')}
          disabled={disabled}
          value={selectedTemplate?.id ?? ''}
          helperText={t('blocks.blockTemplate.linkedInfo')}
          onChange={event =>
            onChange({
              template:
                templates.find(
                  template => template.id === event.target.value
                ) ?? null,
            })
          }
          fullWidth
        >
          <MenuItem value="">{t('blocks.blockTemplate.select')}</MenuItem>

          {templates.map(({ id, name }) => (
            <MenuItem
              key={id}
              value={id}
            >
              {name}
            </MenuItem>
          ))}
        </TextField>

        <IconButtonTooltip caption={t('blocks.blockTemplate.reload')}>
          <IconButton
            aria-label={t('blocks.blockTemplate.reload')}
            onClick={event => {
              refetch();
              event.preventDefault();
            }}
          >
            <MdRefresh />
          </IconButton>
        </IconButtonTooltip>
      </Picker>

      {!!selectedTemplate && (
        <Actions>
          <Button
            variant="text"
            startIcon={<MdEdit />}
            href={`/block-content/templates/edit/${selectedTemplate.id}`}
            target="_blank"
          >
            {t('blocks.blockTemplate.editTemplate')}
          </Button>

          <Button
            variant="text"
            startIcon={<MdOutput />}
            disabled={disabled || !onReplace || !blocks.length}
            onClick={() => setConfirmOpen(true)}
          >
            {t('blocks.blockTemplate.useContent')}
          </Button>
        </Actions>
      )}

      {!!selectedTemplate && (
        <Preview>
          {blocks
            .filter(block => !block.value.disabled)
            .map(block => {
              const { field, label, icon } = blockMap[block.type];

              return (
                <PreviewItem
                  variant="outlined"
                  key={block.key}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <PreviewLabel>
                      {icon}
                      <span>{t(label)}</span>
                    </PreviewLabel>

                    <PreviewBlock>
                      {field({
                        value: block.value,
                        onChange: () => undefined,
                        disabled: true,
                      })}
                    </PreviewBlock>
                  </CardContent>
                </PreviewItem>
              );
            })}
        </Preview>
      )}

      {isConfirmOpen && (
        <ConfirmActionModal
          title={t('blocks.blockTemplate.useContentConfirmTitle')}
          message={t('blocks.blockTemplate.useContentConfirmMessage')}
          onConfirm={() => {
            setConfirmOpen(false);
            onReplace?.(blocks);
          }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </Wrapper>
  );
};
