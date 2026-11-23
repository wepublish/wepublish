import { PrintIssueStartQuery } from '@wepublish/website/api';
import { createContext, useContext } from 'react';

export type ZwoelfSubscribeMode = 'self' | 'gift';
export type ZwoelfSubscribeStep = 1 | 2;

/** The issues a new subscriber chooses the first one from; null: nothing to choose. */
export type ZwoelfPrintIssueStart = NonNullable<
  PrintIssueStartQuery['printIssueStart']
>;

/** «Abo-Start»: '' until the reader chose. */
export type ZwoelfFirstIssueChoice = '' | 'current' | 'upcoming';

export type ZwoelfSubscribeStepContextProps = {
  /** 1 = choose for whom, duration and plan; 2 = personal data and payment */
  step: ZwoelfSubscribeStep;
  setStep: (step: ZwoelfSubscribeStep) => void;
  mode: ZwoelfSubscribeMode;
  setMode: (mode: ZwoelfSubscribeMode) => void;
  /** the current and the next issue; null while print issues are off or none shipped */
  printStart: ZwoelfPrintIssueStart | null;
  firstIssue: ZwoelfFirstIssueChoice;
  setFirstIssue: (choice: ZwoelfFirstIssueChoice) => void;
  /** «Abo-Start» was required but missing when the reader went on */
  firstIssueMissing: boolean;
  setFirstIssueMissing: (missing: boolean) => void;
  /** whether the chosen plan and duration print issues: only then it is asked */
  firstIssueApplies: boolean;
  setFirstIssueApplies: (applies: boolean) => void;
};

export const ZwoelfSubscribeStepContext =
  createContext<ZwoelfSubscribeStepContextProps>({
    step: 1,
    setStep: () => undefined,
    mode: 'self',
    setMode: () => undefined,
    printStart: null,
    firstIssue: '',
    setFirstIssue: () => undefined,
    firstIssueMissing: false,
    setFirstIssueMissing: () => undefined,
    firstIssueApplies: false,
    setFirstIssueApplies: () => undefined,
  });

export const useZwoelfSubscribeStep = () =>
  useContext(ZwoelfSubscribeStepContext);
