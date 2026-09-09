import { Button } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdUnfoldLess, MdUnfoldMore } from 'react-icons/md';

export const useExpandable = (keys: string[]) => {
  const [open, setOpen] = useState<Set<string>>(new Set());

  const isOpen = useCallback((key: string) => open.has(key), [open]);

  const toggle = useCallback(
    (key: string) =>
      setOpen(prev =>
        prev.size === 1 && prev.has(key) ? new Set() : new Set([key])
      ),
    []
  );

  const allOpen = keys.length > 0 && open.size === keys.length;

  const toggleAll = useCallback(
    () =>
      setOpen(prev => (prev.size === keys.length ? new Set() : new Set(keys))),
    [keys]
  );

  return { isOpen, toggle, allOpen, toggleAll };
};

type ExpandCollapseAllButtonProps = {
  allOpen: boolean;
  onToggleAll: () => void;
};

export const ExpandCollapseAllButton = ({
  allOpen,
  onToggleAll,
}: ExpandCollapseAllButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      size="small"
      variant="text"
      startIcon={allOpen ? <MdUnfoldLess /> : <MdUnfoldMore />}
      onClick={onToggleAll}
      sx={{ mb: 1, alignSelf: 'flex-start' }}
    >
      {allOpen ?
        t('websiteSettings.theme.collapseAll')
      : t('websiteSettings.theme.expandAll')}
    </Button>
  );
};
