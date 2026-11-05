import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoalType,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { CurrencyInput, IconButtonTooltip } from '@wepublish/ui/editor';
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useEffect, useId, useRef } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';

interface CrowdfundingGoalListProps {
  goalType: CrowdfundingGoalType;
  goals: CreateCrowdfundingGoalInput[];
  onAdd: (goal: CreateCrowdfundingGoalInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updatedGoal: CreateCrowdfundingGoalInput) => void;
}

export const CrowdfundingGoalList = ({
  goalType,
  goals,
  onAdd,
  onRemove,
  onUpdate,
}: CrowdfundingGoalListProps) => {
  const { t } = useTranslation();

  const handleChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedGoal = { ...goals[index], [field]: value };
    onUpdate(index, updatedGoal);
  };

  const amountLabel =
    goalType === CrowdfundingGoalType.Subscription ?
      t('crowdfunding.goalsForm.amountSubscriptions')
    : t('crowdfunding.goalsForm.amount');

  const titleRefs = useRef<(HTMLInputElement | null)[]>([]);
  const removeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const addRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<
    { kind: 'added' } | { kind: 'removed'; index: number } | null
  >(null);

  useEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;

    if (pending?.kind === 'added') {
      titleRefs.current[goals.length - 1]?.focus();
    }

    if (pending?.kind === 'removed') {
      const next = Math.min(pending.index, goals.length - 1);
      const target = next >= 0 ? removeRefs.current[next] : addRef.current;
      target?.focus();
    }
  }, [goals.length]);

  const columnId = useId();
  const titleId = `${columnId}-title`;
  const descriptionId = `${columnId}-description`;
  const amountId = `${columnId}-amount`;

  return (
    <>
      {goals.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell id={titleId}>
                  {t('crowdfunding.goalsForm.title')}
                </TableCell>
                <TableCell id={descriptionId}>
                  {t('crowdfunding.goalsForm.description')}
                </TableCell>
                <TableCell id={amountId}>{amountLabel}</TableCell>
                <TableCell align="right">{t('action')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {goals.map((goal, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      name="goalTitle"
                      value={goal.title}
                      onChange={event =>
                        handleChange(index, 'title', event.target.value)
                      }
                      inputRef={(element: HTMLInputElement | null) => {
                        titleRefs.current[index] = element;
                      }}
                      slotProps={{ htmlInput: { 'aria-labelledby': titleId } }}
                      fullWidth
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      name="goalDescription"
                      value={goal.description}
                      onChange={event =>
                        handleChange(index, 'description', event.target.value)
                      }
                      slotProps={{
                        htmlInput: { 'aria-labelledby': descriptionId },
                      }}
                      fullWidth
                    />
                  </TableCell>

                  <TableCell>
                    {goalType === CrowdfundingGoalType.Revenue && (
                      <CurrencyInput
                        name="goalAmount"
                        aria-labelledby={amountId}
                        currency=""
                        centAmount={goal.amount}
                        onChange={value =>
                          handleChange(index, 'amount', value || 0)
                        }
                      />
                    )}

                    {goalType === CrowdfundingGoalType.Subscription && (
                      <TextField
                        name="goalAmount"
                        type="number"
                        value={goal.amount}
                        onChange={event =>
                          handleChange(
                            index,
                            'amount',
                            +(event.target.value || 0)
                          )
                        }
                        slotProps={{
                          htmlInput: { 'aria-labelledby': amountId },
                        }}
                        fullWidth
                      />
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <IconButtonTooltip
                      caption={t('crowdfunding.goalsForm.remove')}
                    >
                      <IconButton
                        color="error"
                        aria-label={t('crowdfunding.goalsForm.remove')}
                        ref={element => {
                          removeRefs.current[index] = element;
                        }}
                        onClick={() => {
                          pendingFocus.current = { kind: 'removed', index };
                          onRemove(index);
                        }}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Button
        variant="text"
        startIcon={<MdAdd />}
        ref={addRef}
        onClick={() => {
          pendingFocus.current = { kind: 'added' };
          onAdd({ title: '', description: '', amount: 0 });
        }}
      >
        {t('crowdfunding.goalsForm.add')}
      </Button>
    </>
  );
};
