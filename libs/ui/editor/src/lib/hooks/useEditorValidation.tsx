import {
  createContext,
  MutableRefObject,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

export type ValidatorResult = {
  ok: boolean;
  summary?: string;
};

export type Validator = () => ValidatorResult;

export type ValidationFailure = {
  id: string;
  summary?: string;
  focus?: () => void;
};

export type AggregatedValidation = {
  ok: boolean;
  failures: ValidationFailure[];
};

type RegisteredValidator = {
  validate: Validator;
  focus?: () => void;
};

type RegistryContextValue = {
  register: (id: string, validator: RegisteredValidator) => void;
  unregister: (id: string) => void;
};

const RegistryContext = createContext<RegistryContextValue | null>(null);

const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

const focusInto = (target: HTMLElement | null) => {
  if (!target) {
    return;
  }

  if (target.matches(FOCUSABLE) || target.hasAttribute('tabindex')) {
    target.focus();
    return;
  }

  const inner = target.querySelector<HTMLElement>(FOCUSABLE);

  if (inner) {
    inner.focus();
    return;
  }

  target.setAttribute('tabindex', '-1');
  target.focus();
};

export type EditorValidationProviderProps = {
  runAllRef: MutableRefObject<() => AggregatedValidation>;
  children: ReactNode;
};

export function EditorValidationProvider({
  runAllRef,
  children,
}: EditorValidationProviderProps) {
  const validators = useRef(new Map<string, RegisteredValidator>());

  const register = useCallback((id: string, validator: RegisteredValidator) => {
    validators.current.set(id, validator);
  }, []);

  const unregister = useCallback((id: string) => {
    validators.current.delete(id);
  }, []);

  useImperativeHandle(
    runAllRef,
    () => () => {
      const failures: ValidationFailure[] = [];

      for (const [id, { validate, focus }] of validators.current) {
        const result = validate();
        if (!result.ok) {
          failures.push({ id, summary: result.summary, focus });
        }
      }

      return { ok: failures.length === 0, failures };
    },
    []
  );

  const value = useMemo<RegistryContextValue>(
    () => ({ register, unregister }),
    [register, unregister]
  );

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
}

export function useRegisterValidator(
  id: string,
  validator: Validator,
  focusTarget?: RefObject<HTMLElement | null>
) {
  const ctx = useContext(RegistryContext);
  const validatorRef = useRef(validator);
  const hasFocusTarget = Boolean(focusTarget);
  const focusTargetRef = useRef(focusTarget);

  useEffect(() => {
    validatorRef.current = validator;
    focusTargetRef.current = focusTarget;
  });

  useEffect(() => {
    if (!ctx) {
      return;
    }
    ctx.register(id, {
      validate: () => validatorRef.current(),
      focus:
        hasFocusTarget ?
          () => focusInto(focusTargetRef.current?.current ?? null)
        : undefined,
    });
    return () => ctx.unregister(id);
  }, [id, ctx, hasFocusTarget]);
}
