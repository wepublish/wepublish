import { createContext, useContext } from 'react';

export type ZwoelfSubscribeMode = 'self' | 'gift';
export type ZwoelfSubscribeStep = 1 | 2;

export type ZwoelfSubscribeStepContextProps = {
  /** 1 = choose for whom, duration and plan; 2 = personal data and payment */
  step: ZwoelfSubscribeStep;
  setStep: (step: ZwoelfSubscribeStep) => void;
  mode: ZwoelfSubscribeMode;
  setMode: (mode: ZwoelfSubscribeMode) => void;
};

export const ZwoelfSubscribeStepContext =
  createContext<ZwoelfSubscribeStepContextProps>({
    step: 1,
    setStep: () => undefined,
    mode: 'self',
    setMode: () => undefined,
  });

export const useZwoelfSubscribeStep = () =>
  useContext(ZwoelfSubscribeStepContext);
