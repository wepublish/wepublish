import { createContext, useContext } from 'react';

export type FormContextValue = {
  id: string;
};

export const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = () => useContext(FormContext);
