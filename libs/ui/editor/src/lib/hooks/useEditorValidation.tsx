import {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

export type ValidatorResult = {
  ok: boolean;
  summary?: string;
};

export type Validator = () => ValidatorResult;

export type AggregatedValidation = {
  ok: boolean;
  failures: { id: string; summary?: string }[];
};

type RegistryContextValue = {
  register: (id: string, validator: Validator) => void;
  unregister: (id: string) => void;
};

const RegistryContext = createContext<RegistryContextValue | null>(null);

export type EditorValidationProviderProps = {
  runAllRef: MutableRefObject<() => AggregatedValidation>;
  children: ReactNode;
};

export function EditorValidationProvider({
  runAllRef,
  children,
}: EditorValidationProviderProps) {
  const validators = useRef(new Map<string, Validator>());

  const register = useCallback((id: string, validator: Validator) => {
    validators.current.set(id, validator);
  }, []);

  const unregister = useCallback((id: string) => {
    validators.current.delete(id);
  }, []);

  runAllRef.current = () => {
    const failures: { id: string; summary?: string }[] = [];
    for (const [id, validator] of validators.current) {
      const result = validator();
      if (!result.ok) failures.push({ id, summary: result.summary });
    }
    return { ok: failures.length === 0, failures };
  };

  const value = useRef<RegistryContextValue>({ register, unregister }).current;

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
}

export function useRegisterValidator(id: string, validator: Validator) {
  const ctx = useContext(RegistryContext);
  const validatorRef = useRef(validator);
  validatorRef.current = validator;

  useEffect(() => {
    if (!ctx) return;
    ctx.register(id, () => validatorRef.current());
    return () => ctx.unregister(id);
  }, [id, ctx]);
}
