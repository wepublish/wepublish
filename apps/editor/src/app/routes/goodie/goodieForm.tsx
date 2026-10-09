import styled from '@emotion/styled';
import {
  Card,
  CardContent,
  Drawer,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  FullImageFragment,
  FullMemberPlanFragment,
  MutationCreateGoodieArgs,
  MutationUpdateGoodieArgs,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  DRAWER_WIDTHS,
  ImageEditPanel,
  ImageSelectPanel,
  InfoTooltip,
  RichTextBlock,
  RichTextBlockValue,
  SelectMemberPlans,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, NumberInput } from 'rsuite';

export type GoodieFormData = (
  | MutationCreateGoodieArgs
  | MutationUpdateGoodieArgs
) & {
  image?: FullImageFragment | null;
  memberPlans?: Pick<FullMemberPlanFragment, 'id' | 'name'>[];
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
  gap: 16px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const GoodieFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 16px;
`;

const NameStockGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px);
  align-self: stretch;
  gap: 16px;

  .rs-form-group {
    min-width: 0;
  }

  .rs-form-control,
  .rs-input-group {
    width: 100%;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const GoodieForm = ({ goodie, onChange, create }: GoodieFormProps) => {
  const { t } = useTranslation();
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <GoodieFormWrapper>
        <GoodieFormSection>
          <Card variant="outlined">
            <CardContent>
              <Form.Stack>
                <Form.Group controlId="active">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!goodie.active}
                        onChange={(_event, active) => onChange({ active })}
                      />
                    }
                    label={
                      <>
                        {t('goodie.form.active')}{' '}
                        <InfoTooltip text={t('goodie.form.activeInfo')} />
                      </>
                    }
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
                    <Form.Label>
                      {t('goodie.form.stock')}{' '}
                      <InfoTooltip text={t('goodie.form.stockInfo')} />
                    </Form.Label>

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
            </CardContent>
          </Card>
        </GoodieFormSection>

        <GoodieFormSection>
          <Card
            variant="outlined"
            css={{ overflow: 'initial' }}
          >
            <CardContent>
              <Form.Stack>
                <Form.Group controlId="memberPlanIDs">
                  <Form.Label>
                    {t('goodie.form.memberPlans')}{' '}
                    <InfoTooltip text={t('goodie.form.memberPlansInfo')} />
                  </Form.Label>

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
            </CardContent>
          </Card>
        </GoodieFormSection>
      </GoodieFormWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isChooseModalOpen}
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
          anchor="right"
          slotProps={{
            paper: {
              sx: {
                display: 'flex',
                flexDirection: 'column',
                width: DRAWER_WIDTHS.sm,
                maxWidth: '100vw',
              },
            },
          }}
          open={isEditModalOpen}
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
