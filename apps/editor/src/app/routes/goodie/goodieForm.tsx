import styled from '@emotion/styled';
import {
  Card,
  CardContent,
  Drawer,
  FormControlLabel,
  FormLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import {
  FullImageFragment,
  FullMemberPlanFragment,
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
import { useId, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export const goodieSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  stock: z.coerce.number().int().min(0).nullish(),
  active: z.boolean(),
  description: z.custom<RichTextBlockValue['richText']>().nullish(),
  memberPlanIDs: z.array(z.string()),
  memberPlans: z
    .array(z.custom<Pick<FullMemberPlanFragment, 'id' | 'name'>>())
    .optional(),
  imageID: z.string().nullish(),
  image: z.custom<FullImageFragment>().nullish(),
});

export type GoodieFormValues = z.infer<typeof goodieSchema>;

type GoodieFormProps = {
  create?: boolean;
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

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const GoodieForm = ({ create }: GoodieFormProps) => {
  const { t } = useTranslation();
  const { control, setValue } = useFormContext<GoodieFormValues>();
  const memberPlans = useWatch({ control, name: 'memberPlans' });
  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const memberPlansLabelId = useId();
  const descriptionLabelId = useId();
  const imageLabelId = useId();

  const image = useWatch({ control, name: 'image' });

  return (
    <>
      <GoodieFormWrapper>
        <GoodieFormSection>
          <Card>
            <CardContent>
              <Stack
                direction="column"
                spacing={3}
              >
                <FormControlLabel
                  control={
                    <Controller
                      control={control}
                      name="active"
                      render={({ field }) => (
                        <Switch
                          checked={Boolean(field.value)}
                          onChange={(_event, active) => field.onChange(active)}
                        />
                      )}
                    />
                  }
                  label={
                    <>
                      {t('goodie.form.active')}{' '}
                      <InfoTooltip text={t('goodie.form.activeInfo')} />
                    </>
                  }
                />

                <NameStockGrid>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={t('goodie.form.name')}
                        error={Boolean(error)}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="stock"
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={
                          <>
                            {t('goodie.form.stock')}{' '}
                            <InfoTooltip text={t('goodie.form.stockInfo')} />
                          </>
                        }
                        type="number"
                        slotProps={{ htmlInput: { min: 0 } }}
                        placeholder={t('goodie.overview.unlimited')}
                        onChange={event =>
                          field.onChange(
                            event.target.value === '' ?
                              null
                            : +event.target.value
                          )
                        }
                        error={Boolean(error)}
                        helperText={error?.message}
                        fullWidth
                      />
                    )}
                  />
                </NameStockGrid>

                <div>
                  <FormLabel id={descriptionLabelId}>
                    {t('goodie.form.description')}
                  </FormLabel>

                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <RichTextBlock
                        aria-labelledby={descriptionLabelId}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </Stack>
            </CardContent>
          </Card>
        </GoodieFormSection>

        <GoodieFormSection>
          <Card
            variant="outlined"
            css={{ overflow: 'initial' }}
          >
            <CardContent>
              <Stack
                direction="column"
                spacing={3}
              >
                <div>
                  <FormLabel>
                    <span id={memberPlansLabelId}>
                      {t('goodie.form.memberPlans')}
                    </span>{' '}
                    <InfoTooltip text={t('goodie.form.memberPlansInfo')} />
                  </FormLabel>

                  <Controller
                    control={control}
                    name="memberPlanIDs"
                    render={({ field }) => (
                      <SelectMemberPlans
                        aria-labelledby={memberPlansLabelId}
                        name="memberPlanIDs"
                        defaultMemberPlans={memberPlans ?? []}
                        selectedMemberPlans={field.value ?? []}
                        setSelectedMemberPlans={field.onChange}
                      />
                    )}
                  />
                </div>

                <div>
                  <FormLabel id={imageLabelId}>
                    {t('goodie.form.image')}
                  </FormLabel>

                  <Controller
                    control={control}
                    name="image"
                    render={({ field }) => (
                      <ChooseEditImage
                        aria-labelledby={imageLabelId}
                        onSelect={(chosen: FullImageFragment) => {
                          setChooseModalOpen(false);
                          setValue('imageID', chosen.id);
                          setValue('image', chosen);
                        }}
                        image={field.value}
                        disabled={false}
                        openChooseModalOpen={() => setChooseModalOpen(true)}
                        openEditModalOpen={() => setEditModalOpen(true)}
                        removeImage={() => {
                          field.onChange(null);
                          setValue('imageID', null);
                        }}
                      />
                    )}
                  />
                </div>
              </Stack>
            </CardContent>
          </Card>
        </GoodieFormSection>
      </GoodieFormWrapper>

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
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
          onSelect={(chosen: FullImageFragment) => {
            setChooseModalOpen(false);
            setValue('imageID', chosen.id);
            setValue('image', chosen);
          }}
        />
      </Drawer>

      {image && (
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
            id={image.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  );
};
