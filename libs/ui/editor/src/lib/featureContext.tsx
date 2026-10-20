import { useQuery } from '@apollo/client/react';
import { FeaturesDocument } from '@wepublish/editor/api';
import type { FeatureKey } from '@wepublish/features';
import {
  ComponentType,
  createContext,
  createElement,
  PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import { AuthContext } from './authContext';

/** Undefined until the medium's features are known. */
const FeaturesContext = createContext<ReadonlySet<string> | undefined>(
  undefined
);

export function FeaturesProvider({ children }: PropsWithChildren) {
  const { session } = useContext(AuthContext);
  const { data } = useQuery(FeaturesDocument, { skip: !session });

  const features = useMemo(
    () => (data ? new Set(data.features) : undefined),
    [data]
  );

  return (
    <FeaturesContext.Provider value={features}>
      {children}
    </FeaturesContext.Provider>
  );
}

export const useFeatures = () => useContext(FeaturesContext);

/**
 * Whether this medium has a feature switched on in We.Publish One.
 * Unlike `useHasPermission` this is false until the answer is known: a feature
 * that is not ready must never flash into the menu.
 */
export function useFeature(feature: FeatureKey): boolean {
  return useContext(FeaturesContext)?.has(feature) ?? false;
}

export function FeatureControl({
  feature,
  children,
}: PropsWithChildren<{ feature: FeatureKey }>) {
  return useFeature(feature) ? <>{children}</> : null;
}

export const createCheckedFeatureComponent =
  (feature: FeatureKey) =>
  <P extends object>(ControlledComponent: ComponentType<P>) =>
  (props: P) => (
    <FeatureControl feature={feature}>
      {createElement(ControlledComponent, props)}
    </FeatureControl>
  );
