import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Autocomplete,
  AutocompleteCloseReason,
  FormHelperText,
  InputAdornment,
  TextField,
  Tooltip,
} from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { StateColor, StatePill, useDebouncedValue } from '@wepublish/ui/editor';
import { FocusEvent, UIEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdCheck,
  MdClose,
  MdDragIndicator,
  MdOutlineArticle,
  MdOutlineCardMembership,
  MdOutlineEvent,
  MdOutlineLock,
  MdOutlinePerson,
  MdOutlineWeb,
  MdSearch,
  MdSwapHoriz,
} from 'react-icons/md';

import {
  canAddRecord,
  moveRecordId,
  RecordField,
  RecordId,
  RecordModel,
  RecordOption,
  RecordStatus,
  RecordValue,
  removeRecordId,
  toggleRecordId,
  toRecordIds,
} from './record.field';
import {
  RecordModelLabels,
  useRecordModelLabels,
  useRecordStatusLabels,
} from './record.labels';
import { RecordSource, useRecordSource } from './record.sources';
import {
  RecordActionButton,
  RecordActions,
  RecordCard,
  RecordCheck,
  RecordCounter,
  RecordDragHandle,
  RecordFooter,
  RecordItem,
  RecordItemActions,
  RecordList,
  RecordMeta,
  RecordOptionItem,
  RecordRowRoot,
  RecordStack,
  RecordText,
  RecordThumbnail,
  RecordTitle,
} from './record-select.styles';

const loadMoreThreshold = 48;
const searchDebounceMs = 300;

const recordModelIcons: Record<RecordModel, IconType> = {
  article: MdOutlineArticle,
  page: MdOutlineWeb,
  event: MdOutlineEvent,
  memberPlan: MdOutlineCardMembership,
  author: MdOutlinePerson,
  paywall: MdOutlineLock,
};

const recordStatusColors: Record<RecordStatus, StateColor> = {
  published: StateColor.published,
  pending: StateColor.pending,
  draft: StateColor.draft,
  none: StateColor.none,
};

const useRecordTitle = (model: RecordModel) => {
  const { t } = useTranslation();
  const labels: RecordModelLabels = useRecordModelLabels()[model];

  return (option: RecordOption | undefined, loading: boolean) => {
    if (option) {
      return option.title || t('', 'Untitled');
    }

    return loading ? t('', 'Loading…') : labels.unknown;
  };
};

type RecordRowProps = {
  model: RecordModel;
  recordId: RecordId;
  option: RecordOption | undefined;
  loading: boolean;
};

const RecordRow = ({ model, recordId, option, loading }: RecordRowProps) => {
  const statusLabels = useRecordStatusLabels();
  const titleOf = useRecordTitle(model);
  const Icon = recordModelIcons[model];
  const subtitle = option ? option.subtitle : !loading && recordId;
  const status = option?.status && option.status !== 'none' && option.status;

  return (
    <RecordRowRoot>
      <RecordThumbnail aria-hidden>
        {option?.imageUrl ?
          <img
            src={option.imageUrl}
            alt=""
            loading="lazy"
          />
        : <Icon />}
      </RecordThumbnail>

      <RecordText>
        <RecordTitle dimmed={!option?.title}>
          {titleOf(option, loading)}
        </RecordTitle>

        {(status || subtitle) && (
          <RecordMeta>
            {status && (
              <StatePill
                size="small"
                state={recordStatusColors[status]}
              >
                <span>{statusLabels[status]}</span>
              </StatePill>
            )}

            {subtitle && <span data-subtitle>{subtitle}</span>}
          </RecordMeta>
        )}
      </RecordText>
    </RecordRowRoot>
  );
};

type RecordActionProps = {
  label: string;
  tooltip: string;
  icon: IconType;
  disabled?: boolean;
  autoFocus?: boolean;
  onClick: () => void;
};

const RecordAction = ({
  label,
  tooltip,
  icon: Icon,
  disabled,
  autoFocus,
  onClick,
}: RecordActionProps) => (
  <Tooltip title={tooltip}>
    <RecordActionButton
      type="button"
      size="small"
      aria-label={label}
      aria-disabled={disabled || undefined}
      autoFocus={autoFocus}
      onClick={disabled ? undefined : onClick}
    >
      <Icon size={18} />
    </RecordActionButton>
  </Tooltip>
);

type RecordSearchProps = {
  model: RecordModel;
  source: RecordSource;
  id?: string;
  label: string;
  placeholder: string;
  selectedIds: RecordId[];
  multiple?: boolean;
  canAdd?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  autoOpen?: boolean;
  describedBy?: string;
  onPick: (option: RecordOption) => void;
  onDismiss?: (reason: AutocompleteCloseReason) => void;
};

const RecordSearch = ({
  model,
  source,
  id,
  label,
  placeholder,
  selectedIds,
  multiple = false,
  canAdd = true,
  disabled,
  autoFocus,
  autoOpen = false,
  describedBy,
  onPick,
  onDismiss,
}: RecordSearchProps) => {
  const { t } = useTranslation();
  const labels = useRecordModelLabels()[model];
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(autoOpen);
  const debouncedQuery = useDebouncedValue(query, searchDebounceMs);
  const { options, loading, error, loadMore } = source.useSearch(
    debouncedQuery,
    { skip: !open }
  );

  const handleListboxScroll = (event: UIEvent<HTMLElement>) => {
    const listbox = event.currentTarget;

    if (
      listbox.scrollTop + listbox.clientHeight >=
      listbox.scrollHeight - loadMoreThreshold
    ) {
      loadMore();
    }
  };

  return (
    <Autocomplete
      id={id}
      size="small"
      fullWidth
      autoHighlight
      disableCloseOnSelect={multiple}
      forcePopupIcon={false}
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={(_event, reason) => {
        setOpen(false);
        onDismiss?.(reason);
      }}
      options={options}
      value={null}
      inputValue={query}
      onInputChange={(_event, next, reason) => {
        if (reason === 'input' || reason === 'clear' || reason === 'blur') {
          setQuery(next);
        }
      }}
      onChange={(_event, option) => {
        if (!option) {
          return;
        }

        if (!multiple) {
          setQuery('');
        }

        onPick(option);
      }}
      filterOptions={current => current}
      getOptionKey={option => option.id}
      getOptionLabel={option => option.title}
      getOptionDisabled={option => !canAdd && !selectedIds.includes(option.id)}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading || query !== debouncedQuery}
      loadingText={t('', 'Searching…')}
      noOptionsText={
        error ? t('', 'The search failed, try again.') : labels.empty
      }
      renderOption={({ key, ...props }, option) => {
        const selected = selectedIds.includes(option.id);

        return (
          <RecordOptionItem
            key={key}
            {...props}
            role="option"
            aria-selected={selected}
          >
            <RecordRow
              model={model}
              recordId={option.id}
              option={option}
              loading={false}
            />

            {(multiple || selected) && (
              <RecordCheck aria-hidden>{selected && <MdCheck />}</RecordCheck>
            )}
          </RecordOptionItem>
        );
      }}
      slotProps={{
        listbox: {
          onScroll: handleListboxScroll,
          'aria-multiselectable': multiple || undefined,
        },
      }}
      renderInput={params => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <MdSearch aria-hidden />
                  </InputAdornment>
                  {params.slotProps.input.startAdornment}
                </>
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-label': label,
              'aria-describedby': describedBy,
            },
          }}
        />
      )}
    />
  );
};

export type RecordSelectProps = {
  model: RecordModel;
  value: RecordId | undefined;
  onChange: (id: RecordId | undefined) => void;
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  id?: string;
};

const RecordSelectContent = ({
  model,
  value,
  onChange,
  label,
  placeholder,
  readOnly,
  id,
}: RecordSelectProps) => {
  const { t } = useTranslation();
  const source = useRecordSource(model);
  const labels = useRecordModelLabels()[model];
  const titleOf = useRecordTitle(model);
  const { records, loading } = source.useRecords(value ? [value] : []);
  const [picked, setPicked] = useState<RecordOption>();
  const [replacing, setReplacing] = useState(false);
  const [focusTarget, setFocusTarget] = useState<'search' | 'replace'>();
  const replaceButton = useRef<HTMLSpanElement>(null);
  const name = label ?? labels.one;

  const focusReplaceButton = () =>
    replaceButton.current?.querySelector('button')?.focus();

  const pick = (option: RecordOption) => {
    setPicked(option);
    setReplacing(false);
    setFocusTarget('replace');
    focusReplaceButton();
    onChange(option.id);
  };

  const forgetFocusWhenLeaving = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusTarget(undefined);
    }
  };

  if (!value) {
    return (
      <RecordStack onBlur={forgetFocusWhenLeaving}>
        <RecordSearch
          model={model}
          source={source}
          id={id}
          label={name}
          placeholder={placeholder ?? labels.search}
          selectedIds={[]}
          disabled={readOnly}
          autoFocus={focusTarget === 'search'}
          onPick={pick}
        />
      </RecordStack>
    );
  }

  const record = records[value] ?? (picked?.id === value ? picked : undefined);
  const title = titleOf(record, loading);

  return (
    <RecordStack onBlur={forgetFocusWhenLeaving}>
      <RecordCard>
        <RecordRow
          model={model}
          recordId={value}
          option={record}
          loading={loading}
        />

        {!readOnly && (
          <RecordActions>
            <span ref={replaceButton}>
              <RecordAction
                label={t('', 'Replace {{title}}', { title })}
                tooltip={t('', 'Replace')}
                icon={MdSwapHoriz}
                autoFocus={focusTarget === 'replace'}
                onClick={() => setReplacing(true)}
              />
            </span>

            <RecordAction
              label={t('', 'Remove {{title}}', { title })}
              tooltip={t('', 'Remove')}
              icon={MdClose}
              onClick={() => {
                setReplacing(false);
                setFocusTarget('search');
                onChange(undefined);
              }}
            />
          </RecordActions>
        )}
      </RecordCard>

      {replacing && (
        <RecordSearch
          model={model}
          source={source}
          id={id}
          label={name}
          placeholder={placeholder ?? labels.search}
          selectedIds={[value]}
          autoFocus
          autoOpen
          onPick={pick}
          onDismiss={reason => {
            if (reason !== 'escape' && reason !== 'blur') {
              return;
            }

            setReplacing(false);

            if (reason === 'escape') {
              focusReplaceButton();
            }
          }}
        />
      )}
    </RecordStack>
  );
};

export const RecordSelect = (props: RecordSelectProps) => (
  <RecordSelectContent
    key={props.model}
    {...props}
  />
);

type SortableRecordProps = {
  model: RecordModel;
  recordId: RecordId;
  index: number;
  count: number;
  option: RecordOption | undefined;
  loading: boolean;
  readOnly?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (id: RecordId) => void;
};

const SortableRecord = ({
  model,
  recordId,
  index,
  count,
  option,
  loading,
  readOnly,
  onMove,
  onRemove,
}: SortableRecordProps) => {
  const { t } = useTranslation();
  const titleOf = useRecordTitle(model);
  const title = titleOf(option, loading);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: recordId, disabled: readOnly });

  return (
    <RecordItem
      ref={setNodeRef}
      dragging={isDragging}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {!readOnly && (
        <RecordDragHandle
          ref={setActivatorNodeRef}
          type="button"
          aria-label={t('', 'Drag {{title}} to reorder', { title })}
          {...attributes}
          {...listeners}
        >
          <MdDragIndicator size={18} />
        </RecordDragHandle>
      )}

      <RecordRow
        model={model}
        recordId={recordId}
        option={option}
        loading={loading}
      />

      {!readOnly && (
        <RecordItemActions>
          <RecordAction
            label={t('', 'Move {{title}} up', { title })}
            tooltip={t('', 'Move up')}
            icon={MdArrowUpward}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          />

          <RecordAction
            label={t('', 'Move {{title}} down', { title })}
            tooltip={t('', 'Move down')}
            icon={MdArrowDownward}
            disabled={index === count - 1}
            onClick={() => onMove(index, index + 1)}
          />

          <RecordAction
            label={t('', 'Remove {{title}}', { title })}
            tooltip={t('', 'Remove')}
            icon={MdClose}
            onClick={() => onRemove(recordId)}
          />
        </RecordItemActions>
      )}
    </RecordItem>
  );
};

export type RecordMultiSelectProps = {
  model: RecordModel;
  value: RecordId[];
  onChange: (ids: RecordId[]) => void;
  min?: number;
  max?: number;
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  id?: string;
};

const RecordMultiSelectContent = ({
  model,
  value,
  onChange,
  min,
  max,
  label,
  placeholder,
  readOnly,
  id,
}: RecordMultiSelectProps) => {
  const { t } = useTranslation();
  const source = useRecordSource(model);
  const labels = useRecordModelLabels()[model];
  const footerId = useId();
  const searchRoot = useRef<HTMLDivElement>(null);
  const ids = toRecordIds(value);
  const { records, loading } = source.useRecords(ids);
  const [picked, setPicked] = useState<Partial<Record<RecordId, RecordOption>>>(
    {}
  );
  const bounds = { min, max };
  const canAdd = canAddRecord(ids, bounds);
  const belowMin = min !== undefined && ids.length < min;
  const hasFooter = min !== undefined || max !== undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggle = (option: RecordOption) => {
    const next = toggleRecordId(ids, option.id, bounds);

    if (next === ids) {
      return;
    }

    setPicked(previous => ({ ...previous, [option.id]: option }));
    onChange(next);
  };

  const remove = (recordId: RecordId) => {
    onChange(removeRecordId(ids, recordId));
    searchRoot.current?.querySelector('input')?.focus();
  };

  const move = (from: number, to: number) =>
    onChange(moveRecordId(ids, from, to));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <RecordStack>
      {ids.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ids}
            strategy={verticalListSortingStrategy}
          >
            <RecordList aria-label={label ?? labels.many}>
              {ids.map((recordId, index) => (
                <SortableRecord
                  key={recordId}
                  model={model}
                  recordId={recordId}
                  index={index}
                  count={ids.length}
                  option={records[recordId] ?? picked[recordId]}
                  loading={loading}
                  readOnly={readOnly}
                  onMove={move}
                  onRemove={remove}
                />
              ))}
            </RecordList>
          </SortableContext>
        </DndContext>
      )}

      <div ref={searchRoot}>
        <RecordSearch
          model={model}
          source={source}
          id={id}
          label={labels.add}
          placeholder={
            canAdd ? (placeholder ?? labels.search) : t('', 'Maximum reached')
          }
          selectedIds={ids}
          multiple
          canAdd={canAdd}
          disabled={readOnly}
          describedBy={hasFooter ? footerId : undefined}
          onPick={toggle}
        />
      </div>

      {hasFooter && (
        <RecordFooter id={footerId}>
          {min !== undefined && (
            <FormHelperText error={belowMin}>
              {t('', 'Select at least {{min}}', { min })}
            </FormHelperText>
          )}

          {max !== undefined && (
            <RecordCounter aria-live="polite">
              {`${ids.length} / ${max}`}
            </RecordCounter>
          )}
        </RecordFooter>
      )}
    </RecordStack>
  );
};

export const RecordMultiSelect = (props: RecordMultiSelectProps) => (
  <RecordMultiSelectContent
    key={props.model}
    {...props}
  />
);

export type RecordFieldRenderProps = FieldProps<
  RecordField,
  RecordValue | undefined
> & {
  name: string;
  id?: string;
};

export const RecordFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  id,
}: RecordFieldRenderProps) => {
  const labels = useRecordModelLabels()[field.model];
  const label = field.label ?? (field.multiple ? labels.many : labels.one);
  const ids = toRecordIds(value);

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      {field.multiple ?
        <RecordMultiSelect
          model={field.model}
          value={ids}
          min={field.min}
          max={field.max}
          label={label}
          placeholder={field.placeholder}
          readOnly={readOnly}
          id={id}
          onChange={next => onChange(next)}
        />
      : <RecordSelect
          model={field.model}
          value={ids[0]}
          label={label}
          placeholder={field.placeholder}
          readOnly={readOnly}
          id={id}
          onChange={next => onChange(next)}
        />
      }
    </FieldLabel>
  );
};
