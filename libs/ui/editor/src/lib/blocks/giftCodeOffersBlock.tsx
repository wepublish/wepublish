import { useQuery } from '@apollo/client/react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  TextField,
  Typography,
} from '@mui/material';
import { GiftCodeOfferListDocument } from '@wepublish/editor/api';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import {
  BlockSection,
  BlockSectionHeader,
  BlockSections,
} from '../atoms/blockSection';
import { InfoTooltip } from '../atoms/infoTooltip';
import {
  InlineLabel,
  PlanDefault,
  PlanHeader,
  PlanList,
  PlanSummary,
  SortablePlanRow,
  SubscribeBlockFieldsSection,
} from './subscribeBlock';
import { GiftCodeOffersBlockValue } from './types';

export const GiftCodeOffersBlock = ({
  value,
  onChange,
  disabled,
}: BlockProps<GiftCodeOffersBlockValue>) => {
  const { t } = useTranslation();

  const { data, loading } = useQuery(GiftCodeOfferListDocument, {
    variables: { take: 200, filter: { active: true } },
  });

  const offerById = useMemo(
    () =>
      new Map(
        (data?.giftCodeOffers?.nodes ?? []).map(offer => [offer.id, offer])
      ),
    [data?.giftCodeOffers?.nodes]
  );

  const offerLabel = (id: string) => offerById.get(id)?.name ?? id;
  const offerPrice = (id: string) => {
    const offer = offerById.get(id);

    return offer ?
        `${offer.memberPlan.currency} ${(offer.price / 100).toFixed(2)} · ${t(
          `memberPlanList.paymentPeriodicity.${offer.periodicity}`
        )}`
      : null;
  };
  const defaultOfferId =
    value.defaultGiftCodeOfferId ?? value.giftCodeOfferIds[0];
  const defaultRadioName = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    onChange(current => ({
      ...current,
      giftCodeOfferIds: arrayMove(
        current.giftCodeOfferIds,
        current.giftCodeOfferIds.indexOf(String(active.id)),
        current.giftCodeOfferIds.indexOf(String(over.id))
      ),
    }));
  };

  const checkbox = (
    key: 'askRecipientName' | 'showDiscountCodes',
    label: string
  ) => (
    <FormControlLabel
      control={
        <Checkbox
          checked={value[key]}
          disabled={disabled}
          onChange={(_event, checked) =>
            onChange(current => ({ ...current, [key]: checked }))
          }
        />
      }
      label={<Typography variant="body2">{label}</Typography>}
    />
  );

  return (
    <BlockSections>
      <BlockSection>
        <BlockSectionHeader title={t('blocks.giftCodeOffers.selectOffers')} />

        <Autocomplete
          multiple
          disableCloseOnSelect
          disabled={disabled}
          loading={loading}
          options={[...offerById.keys()]}
          getOptionLabel={offerLabel}
          value={value.giftCodeOfferIds}
          onChange={(_event, giftCodeOfferIds) =>
            onChange(current => ({
              ...current,
              giftCodeOfferIds,
              defaultGiftCodeOfferId:
                (
                  current.defaultGiftCodeOfferId &&
                  giftCodeOfferIds.includes(current.defaultGiftCodeOfferId)
                ) ?
                  current.defaultGiftCodeOfferId
                : null,
            }))
          }
          renderInput={params => (
            <TextField
              {...params}
              slotProps={{
                ...params.slotProps,
                htmlInput: {
                  ...params.slotProps.htmlInput,
                  'aria-label': t('blocks.giftCodeOffers.selectOffers'),
                },
              }}
              helperText={t('blocks.giftCodeOffers.selectOffersHint')}
            />
          )}
        />
      </BlockSection>

      {!!value.giftCodeOfferIds.length && (
        <BlockSection>
          <BlockSectionHeader
            title={t('blocks.giftCodeOffers.orderHeading')}
            description={t('blocks.giftCodeOffers.orderHelp')}
          />

          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={value.giftCodeOfferIds}
              strategy={verticalListSortingStrategy}
            >
              <PlanList>
                {value.giftCodeOfferIds.map(id => (
                  <SortablePlanRow
                    key={id}
                    id={id}
                    label={offerLabel(id)}
                    disabled={disabled}
                  >
                    <PlanHeader>
                      <PlanSummary>
                        <Typography
                          variant="subtitle2"
                          noWrap
                          title={offerLabel(id)}
                        >
                          {offerLabel(id)}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {offerPrice(id)}
                        </Typography>
                      </PlanSummary>

                      <PlanDefault
                        control={
                          <Radio
                            size="small"
                            name={defaultRadioName}
                            checked={defaultOfferId === id}
                            disabled={disabled}
                            onChange={() =>
                              onChange(current => ({
                                ...current,
                                defaultGiftCodeOfferId: id,
                              }))
                            }
                          />
                        }
                        label={
                          <InlineLabel>
                            <Typography variant="body2">
                              {t('blocks.subscribe.defaultPlanLabel')}
                            </Typography>
                            <InfoTooltip
                              text={t(
                                'blocks.giftCodeOffers.defaultOfferTitle'
                              )}
                            />
                          </InlineLabel>
                        }
                      />
                    </PlanHeader>
                  </SortablePlanRow>
                ))}
              </PlanList>
            </SortableContext>
          </DndContext>
        </BlockSection>
      )}

      <BlockSection>
        <BlockSectionHeader title={t('blocks.giftCodeOffers.displayHeading')} />

        <FormGroup>
          {checkbox(
            'askRecipientName',
            t('blocks.giftCodeOffers.askRecipientName')
          )}
          {checkbox(
            'showDiscountCodes',
            t('blocks.giftCodeOffers.showDiscountCodes')
          )}
        </FormGroup>
      </BlockSection>

      <SubscribeBlockFieldsSection
        fields={value.fields}
        disabled={disabled}
        onChange={fields => onChange(current => ({ ...current, fields }))}
      />
    </BlockSections>
  );
};
