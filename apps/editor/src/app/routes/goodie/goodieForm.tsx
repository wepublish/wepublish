import styled from '@emotion/styled';
import {
  FullImageFragment,
  MemberPlan,
  MutationCreateGoodieArgs,
  MutationUpdateGoodieArgs,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  ImageEditPanel,
  ImageSelectPanel,
  RichTextBlock,
  RichTextBlockValue,
  SelectMemberPlans,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, Form, NumberInput, Panel, Toggle } from 'rsuite';

export type GoodieFormData = (
  | MutationCreateGoodieArgs
  | MutationUpdateGoodieArgs
) & {
  image?: FullImageFragment | null;
  memberPlans?: Pick<MemberPlan, 'id' | 'name'>[];
};

type GoodieFormProps = {
  create?: boolean;
  goodie: Partial<GoodieFormData>;
  onChange: (changes: Partial<GoodieFormData>) => void;
};

const GoodieFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 12px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const GoodieFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 12px;
`;

const NameStockGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
`;

export const GoodieForm = ({ goodie, onChange, create }: GoodieFormProps) => {
  const { t } = useTranslation();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <GoodieFormWrapper>
        <GoodieFormSection>
          <Panel bordered>
            <Form.Stack>
              <Form.Group controlId="active">
                <Form.Label>{t('goodie.form.active')}</Form.Label>

                <Toggle
                  checked={!!goodie.active}
                  onChange={active => onChange({ active })}
                />
              </Form.Group>

              <NameStockGrid>
                <Form.Group controlId="name">
                  <Form.Label>{t('goodie.form.name')}</Form.Label>

                  <Form.Control
                    name="name"
                    value={goodie.name ?? ''}
                    onChange={(name: string) => onChange({ name })}
                  />
                </Form.Group>

                <Form.Group controlId="stock">
                  <Form.Label>{t('goodie.form.stock')}</Form.Label>

                  <Form.Control
                    name="stock"
                    value={goodie.stock ?? ''}
                    min={0}
                    placeholder={t('goodie.overview.unlimited')}
                    onChange={(stock: string | number | null) =>
                      onChange({
                        stock: stock === '' || stock === null ? null : +stock,
                      })
                    }
                    accepter={NumberInput}
                  />
                </Form.Group>
              </NameStockGrid>

              <Form.Group controlId="description">
                <Form.Label>{t('goodie.form.description')}</Form.Label>

                <RichTextBlock
                  value={goodie.description}
                  onChange={description =>
                    onChange({
                      description:
                        description as RichTextBlockValue['richText'],
                    })
                  }
                />
              </Form.Group>
            </Form.Stack>
          </Panel>
        </GoodieFormSection>

        <GoodieFormSection>
          <Panel
            bordered
            css={{ overflow: 'initial' }}
          >
            <Form.Stack>
              <Form.Group controlId="memberPlanIDs">
                <Form.Label>{t('goodie.form.memberPlans')}</Form.Label>

                <Form.Control
                  name="memberPlanIDs"
                  defaultMemberPlans={goodie.memberPlans ?? []}
                  selectedMemberPlans={goodie.memberPlanIDs ?? []}
                  setSelectedMemberPlans={(memberPlanIDs: string[]) =>
                    onChange({ memberPlanIDs })
                  }
                  accepter={SelectMemberPlans}
                />
              </Form.Group>

              <Form.Group controlId="image">
                <ChooseEditImage
                  image={goodie.image}
                  header={t('goodie.form.image')}
                  disabled={false}
                  openChooseModalOpen={() => setChooseModalOpen(true)}
                  openEditModalOpen={() => setEditModalOpen(true)}
                  removeImage={() => onChange({ imageID: null, image: null })}
                />
              </Form.Group>
            </Form.Stack>
          </Panel>
        </GoodieFormSection>
      </GoodieFormWrapper>

      <Drawer
        open={isChooseModalOpen}
        size="sm"
        onClose={() => setChooseModalOpen(false)}
      >
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setChooseModalOpen(false);
            onChange({ imageID: image.id, image });
          }}
        />
      </Drawer>

      {goodie.image && (
        <Drawer
          open={isEditModalOpen}
          size="sm"
          onClose={() => setEditModalOpen(false)}
        >
          <ImageEditPanel
            id={goodie.image.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
};
