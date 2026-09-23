import styled from '@emotion/styled';
import {
  FullBlockFragment,
  useBlockTemplateListQuery,
  useBlockTemplateQuery,
} from '@wepublish/editor/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdOutput, MdRefresh } from 'react-icons/md';
import {
  ButtonToolbar,
  IconButton,
  Panel as RPanel,
  SelectPicker,
} from 'rsuite';

import { BlockMapType, BlockProps } from '../atoms/blockList';
import { BlockMap } from './blockMap';
import { blockForQueryBlock, BlockTemplateBlockValue } from './types';

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 12px;
`;

const Preview = styled.div`
  display: grid;
  gap: 12px;
  pointer-events: none;
  user-select: none;
`;

const PreviewItem = styled(RPanel)`
  padding: 0;
  background-color: #f7f9fa;
`;

const PreviewLabel = styled.div`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e5ea;
  color: #8e8e93;
`;

const PreviewBlock = styled.div`
  padding: 12px;
`;

export const BlockTemplateBlock = ({
  value: { template },
  onChange,
  onReplace,
  disabled,
}: BlockProps<BlockTemplateBlockValue>) => {
  const { t } = useTranslation();
  const blockMap = BlockMap as BlockMapType;

  const { data, loading, refetch } = useBlockTemplateListQuery({
    variables: { take: 100 },
    fetchPolicy: 'cache-and-network',
  });

  const templates = useMemo(
    () => data?.blockTemplates.nodes ?? [],
    [data?.blockTemplates.nodes]
  );

  const { data: templateData } = useBlockTemplateQuery({
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
      <Toolbar>
        <SelectPicker
          block
          cleanable
          virtualized
          disabled={disabled}
          loading={loading}
          data={templates.map(({ id, name }) => ({ value: id, label: name }))}
          value={selectedTemplate?.id ?? null}
          placeholder={t('blocks.blockTemplate.select')}
          onChange={id =>
            onChange({
              template: templates.find(template => template.id === id) ?? null,
            })
          }
        />

        <ButtonToolbar>
          <IconButton
            icon={<MdRefresh />}
            onClick={event => {
              refetch();
              event.preventDefault();
            }}
          />
          <IconButton
            icon={<MdEdit />}
            disabled={!selectedTemplate}
            href={
              selectedTemplate ?
                `/block-content/templates/edit/${selectedTemplate.id}`
              : undefined
            }
            target="_blank"
          >
            {t('blocks.blockTemplate.editTemplate')}
          </IconButton>

          <IconButton
            icon={<MdOutput />}
            disabled={disabled || !onReplace || !blocks.length}
            onClick={() => onReplace?.(blocks)}
          >
            {t('blocks.blockTemplate.useContent')}
          </IconButton>
        </ButtonToolbar>
      </Toolbar>

      {!!selectedTemplate && (
        <Preview>
          {blocks
            // hidden blocks of the template are not rendered on the website
            .filter(block => !block.value.disabled)
            .map(block => {
              const { field, label, icon } = blockMap[block.type];

              return (
                <PreviewItem
                  key={block.key}
                  bordered
                  bodyFill
                >
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
                </PreviewItem>
              );
            })}
        </Preview>
      )}
    </Wrapper>
  );
};
