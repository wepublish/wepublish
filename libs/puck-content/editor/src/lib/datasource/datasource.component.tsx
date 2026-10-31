import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { RefObject, useEffect, useId, useRef, useState } from 'react';
import { IconType } from 'react-icons';
import {
  MdAdd,
  MdClose,
  MdOutlineArticle,
  MdOutlineAutorenew,
  MdOutlineCardMembership,
  MdOutlineEvent,
  MdOutlineImage,
  MdOutlineWeb,
} from 'react-icons/md';

import { FieldStack } from '../field-controls';
import { ImageMultiPicker, ImagePicker } from '../image/image.component';
import {
  RecordMultiSelect,
  RecordSelect,
} from '../record/record-select.component';
import {
  activeDatasourceModels,
  addableDatasourceModels,
  addDatasourceModel,
  Datasource,
  DatasourceField,
  DatasourceModel,
  datasourceModels,
  DatasourcesValue,
  DatasourceType,
  datasourceTypes,
  DirectDatasource,
  directDatasource,
  imageDatasourceTarget,
  rememberDatasourceIds,
  setDatasourceIdList,
  setDatasourceType,
  toDatasourceRecordModel,
  toDatasourceTypes,
} from './datasource.field';
import { useDatasourceLabels } from './datasource.labels';
import {
  DatasourceAddButton,
  DatasourceCardHeader,
  DatasourceCardIcon,
  DatasourceCardRoot,
  DatasourceCardTitle,
  DatasourceDescription,
  DatasourceTypeOption,
  DatasourceTypeOptions,
} from './datasource.styles';

const datasourceModelIcons: Record<DatasourceModel, IconType> = {
  article: MdOutlineArticle,
  page: MdOutlineWeb,
  event: MdOutlineEvent,
  image: MdOutlineImage,
  memberPlan: MdOutlineCardMembership,
  userSubscription: MdOutlineAutorenew,
};

type DatasourceBodyProps = {
  model: DatasourceModel;
  datasource: Datasource;
  label: string;
  readOnly?: boolean;
  id?: string;
  onIdsChange: (ids: string[]) => void;
};

const DatasourceBody = ({
  model,
  datasource,
  label,
  readOnly,
  id,
  onIdsChange,
}: DatasourceBodyProps) => {
  const labels = useDatasourceLabels();
  const recordModel = toDatasourceRecordModel(model);
  const pickOne = (next: string | undefined) => onIdsChange(next ? [next] : []);

  switch (datasource.type) {
    case 'single':
      if (model === 'image') {
        return (
          <ImagePicker
            value={datasource.id || undefined}
            readOnly={readOnly}
            onChange={pickOne}
          />
        );
      }

      return recordModel ?
          <RecordSelect
            model={recordModel}
            value={datasource.id || undefined}
            label={label}
            readOnly={readOnly}
            id={id}
            onChange={pickOne}
          />
        : null;

    case 'multiple':
      if (model === 'image') {
        return (
          <ImageMultiPicker
            value={datasource.ids}
            label={label}
            readOnly={readOnly}
            uploadTarget={imageDatasourceTarget}
            onChange={onIdsChange}
          />
        );
      }

      return recordModel ?
          <RecordMultiSelect
            model={recordModel}
            value={datasource.ids}
            label={label}
            readOnly={readOnly}
            id={id}
            onChange={onIdsChange}
          />
        : null;

    default:
      return (
        <DatasourceDescription>
          {labels.descriptions[datasource.type](model)}
        </DatasourceDescription>
      );
  }
};

type DatasourceTypeToggleProps = {
  model: DatasourceModel;
  types: DatasourceType[];
  value: DatasourceType;
  readOnly?: boolean;
  onChange: (type: DatasourceType) => void;
};

const DatasourceTypeToggle = ({
  model,
  types,
  value,
  readOnly,
  onChange,
}: DatasourceTypeToggleProps) => {
  const labels = useDatasourceLabels();
  const name = useId();

  return (
    <DatasourceTypeOptions
      role="radiogroup"
      aria-label={labels.typeGroup(model)}
    >
      {types.map(type => {
        const active = value === type;

        return (
          <Tooltip
            key={type}
            title={labels.typeHints[type]}
            describeChild
            disableInteractive
          >
            <DatasourceTypeOption
              active={active}
              disabled={!!readOnly}
            >
              <input
                type="radio"
                name={name}
                value={type}
                checked={active}
                disabled={readOnly}
                onChange={() => onChange(type)}
              />

              {labels.types[type]}
            </DatasourceTypeOption>
          </Tooltip>
        );
      })}
    </DatasourceTypeOptions>
  );
};

type DatasourceCardProps = {
  model: DatasourceModel;
  datasource: Datasource;
  types: DatasourceType[];
  readOnly?: boolean;
  autoFocus?: boolean;
  onTypeChange: (type: DatasourceType, rememberedIds: string[]) => void;
  onIdsChange: (ids: string[]) => void;
  onRemove: () => void;
};

const DatasourceCard = ({
  model,
  datasource,
  types,
  readOnly,
  autoFocus,
  onTypeChange,
  onIdsChange,
  onRemove,
}: DatasourceCardProps) => {
  const labels = useDatasourceLabels();
  const titleId = useId();
  const pickerId = useId();
  const root = useRef<HTMLElement>(null);
  const rememberedIds = useRef<string[]>([]);
  const Icon = datasourceModelIcons[model];
  const label = labels.models[model];

  useEffect(() => {
    if (autoFocus) {
      root.current?.focus();
    }
  }, [autoFocus]);

  const changeType = (type: DatasourceType) => {
    rememberedIds.current = rememberDatasourceIds(
      rememberedIds.current,
      datasource
    );
    onTypeChange(type, rememberedIds.current);
  };

  return (
    <DatasourceCardRoot
      ref={root}
      tabIndex={-1}
      aria-labelledby={titleId}
    >
      <DatasourceCardHeader>
        <DatasourceCardIcon aria-hidden>
          <Icon />
        </DatasourceCardIcon>

        <DatasourceCardTitle id={titleId}>{label}</DatasourceCardTitle>

        {!readOnly && (
          <Tooltip title={labels.remove}>
            <IconButton
              type="button"
              size="small"
              aria-label={labels.removeModel(model)}
              onClick={onRemove}
            >
              <MdClose size={18} />
            </IconButton>
          </Tooltip>
        )}
      </DatasourceCardHeader>

      {types.length > 1 && (
        <DatasourceTypeToggle
          model={model}
          types={types}
          value={datasource.type}
          readOnly={readOnly}
          onChange={changeType}
        />
      )}

      <DatasourceBody
        model={model}
        datasource={datasource}
        label={label}
        readOnly={readOnly}
        id={pickerId}
        onIdsChange={onIdsChange}
      />
    </DatasourceCardRoot>
  );
};

type DatasourceAddMenuProps = {
  models: DatasourceModel[];
  buttonRef: RefObject<HTMLButtonElement | null>;
  onAdd: (model: DatasourceModel) => void;
};

const DatasourceAddMenu = ({
  models,
  buttonRef,
  onAdd,
}: DatasourceAddMenuProps) => {
  const labels = useDatasourceLabels();
  const buttonId = useId();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <DatasourceAddButton
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        aria-controls={anchor ? menuId : undefined}
        onClick={event => setAnchor(event.currentTarget)}
      >
        <MdAdd aria-hidden />
        {labels.add}
      </DatasourceAddButton>

      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { 'aria-labelledby': buttonId, dense: true } }}
      >
        {models.map(model => {
          const Icon = datasourceModelIcons[model];

          return (
            <MenuItem
              key={model}
              onClick={() => {
                setAnchor(null);
                onAdd(model);
              }}
            >
              <ListItemIcon>
                <Icon
                  size={18}
                  aria-hidden
                />
              </ListItemIcon>

              <ListItemText>{labels.models[model]}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

type PendingFocus =
  { target: 'add' } | { target: 'card'; model: DatasourceModel };

type DatasourceCardsFieldProps = {
  label: string;
  models: readonly DatasourceModel[];
  types: readonly DatasourceType[];
  value: DatasourcesValue;
  readOnly?: boolean;
  onChange: (value: DatasourcesValue) => void;
};

const DatasourceCardsField = ({
  label,
  models,
  types,
  value,
  readOnly,
  onChange,
}: DatasourceCardsFieldProps) => {
  const labels = useDatasourceLabels();
  const addButton = useRef<HTMLButtonElement>(null);
  const [pendingFocus, setPendingFocus] = useState<PendingFocus>();
  const addable = addableDatasourceModels(value, models, types);
  const active = activeDatasourceModels(value, models);

  useEffect(() => {
    if (pendingFocus?.target === 'add') {
      addButton.current?.focus();
    }
  }, [pendingFocus]);

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <FieldStack>
        {active.length === 0 && (
          <DatasourceDescription>{labels.empty}</DatasourceDescription>
        )}

        {active.map(model => {
          const datasource = value[model];

          return (
            datasource && (
              <DatasourceCard
                key={model}
                model={model}
                datasource={datasource}
                types={toDatasourceTypes(model, types)}
                readOnly={readOnly}
                autoFocus={
                  pendingFocus?.target === 'card' &&
                  pendingFocus.model === model
                }
                onTypeChange={(type, rememberedIds) =>
                  onChange(setDatasourceType(value, model, type, rememberedIds))
                }
                onIdsChange={ids =>
                  onChange(setDatasourceIdList(value, model, ids))
                }
                onRemove={() => {
                  setPendingFocus({ target: 'add' });
                  onChange(setDatasourceType(value, model, undefined));
                }}
              />
            )
          );
        })}

        {!readOnly && addable.length > 0 && (
          <DatasourceAddMenu
            models={addable}
            buttonRef={addButton}
            onAdd={model => {
              setPendingFocus({ target: 'card', model });
              onChange(addDatasourceModel(value, model, types));
            }}
          />
        )}
      </FieldStack>
    </FieldLabel>
  );
};

type DirectDatasourceFieldProps = {
  label: string | undefined;
  direct: DirectDatasource;
  value: DatasourcesValue;
  readOnly?: boolean;
  id?: string;
  onChange: (value: DatasourcesValue) => void;
};

const DirectDatasourceField = ({
  label,
  direct: { model, type },
  value,
  readOnly,
  id,
  onChange,
}: DirectDatasourceFieldProps) => {
  const labels = useDatasourceLabels();
  const fieldLabel = label ?? labels.models[model];
  const typed = setDatasourceType(value, model, type);
  const datasource = typed[model];

  return (
    <FieldLabel
      label={fieldLabel}
      readOnly={readOnly}
      el="div"
    >
      {datasource && (
        <DatasourceBody
          model={model}
          datasource={datasource}
          label={fieldLabel}
          readOnly={readOnly}
          id={id}
          onIdsChange={ids => onChange(setDatasourceIdList(typed, model, ids))}
        />
      )}
    </FieldLabel>
  );
};

export type DatasourceFieldRenderProps = FieldProps<
  DatasourceField,
  DatasourcesValue | undefined
> & {
  name: string;
};

export const DatasourceFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  id,
}: DatasourceFieldRenderProps) => {
  const labels = useDatasourceLabels();
  const models = field.models ?? datasourceModels;
  const types = field.types ?? datasourceTypes;
  const direct = directDatasource(models, types);

  if (direct) {
    return (
      <DirectDatasourceField
        label={field.label}
        direct={direct}
        value={value ?? {}}
        readOnly={readOnly}
        id={id}
        onChange={onChange}
      />
    );
  }

  return (
    <DatasourceCardsField
      label={field.label ?? labels.field}
      models={models}
      types={types}
      value={value ?? {}}
      readOnly={readOnly}
      onChange={onChange}
    />
  );
};
