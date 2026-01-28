import { PaymentPeriodicity, SortOrder } from '@wepublish/editor/api';
import { getSettings } from '@wepublish/editor/api-v2';
import { de, enUS, fr } from 'date-fns/locale';
import { DocumentNode, OperationDefinitionNode } from 'graphql';
import nanoid from 'nanoid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const addOrUpdateOneInArray = (
  array: Record<string | 'id', any>[] | null | undefined,
  entry: Record<string | 'id', any>
) => {
  let isNew = true;

  if (!array) {
    return [entry];
  }
  const updated = array.map(item => {
    if (item.id !== entry.id) {
      // This isn't the item we care about - keep it as-is
      return item;
    }
    isNew = false;
    // Otherwise, this is the one we want - return an updated value
    return {
      ...item,
      ...entry,
    };
  });

  if (isNew) {
    return [...updated, entry];
  }

  return updated;
};

export function generateID(): string {
  return nanoid();
}

export function useScript(
  src: string,
  checkIfLoaded: () => boolean,
  crossOrigin = false
) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const [isLoading, setLoading] = useState(false);
  const [isLoaded, setLoaded] = useState(() => checkIfLoaded());

  useEffect(() => {
    if (isLoading && !isLoaded && !scriptRef.current) {
      const script = document.createElement('script');

      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => setLoaded(true);
      script.crossOrigin = crossOrigin ? 'anonymous' : null;

      document.head.appendChild(script);
      scriptRef.current = script;
    }
  }, [isLoading, crossOrigin, src, isLoaded]);

  const load = useCallback(() => {
    setLoading(true);
  }, []);

  const result = useMemo(
    () => ({
      isLoading,
      isLoaded,
      load,
    }),
    [isLoading, isLoaded, load]
  );

  if (typeof window !== 'object') {
    return {
      isLoaded: false,
      isLoading: false,
      load: () => {
        /* do nothing */
      },
    };
  }

  return result;
}

export function getOperationNameFromDocument(node: DocumentNode) {
  const firstOperation = node.definitions.find(
    node => node.kind === 'OperationDefinition'
  ) as OperationDefinitionNode;

  if (!firstOperation?.name?.value)
    throw new Error("Coulnd't find operation name.");
  return firstOperation.name.value;
}

export function transformCssStringToObject(
  styleCustom: string
): Record<string, unknown> {
  const styleRules = styleCustom.split(';');
  if (styleRules.length === 0) return {};
  return styleRules.reduce(
    (previousValue: Record<string, unknown>, currentValue: string) => {
      const [key, value] = currentValue.split(':');
      if (key && value) {
        return Object.assign(previousValue, { [key.trim()]: value.trim() });
      }
      return previousValue;
    },
    {}
  );
}

export type SortType = 'asc' | 'desc' | null;

export function mapTableSortTypeToGraphQLSortOrder(
  sortType: SortType
): SortOrder | null {
  switch (sortType) {
    case 'desc':
      return SortOrder.Descending;
    case 'asc':
      return SortOrder.Ascending;
    default:
      return null;
  }
}

export const DEFAULT_TABLE_PAGE_SIZES = [10, 20, 50, 100];
export const DEFAULT_TABLE_IMAGE_PAGE_SIZES = [5, 10, 15];
export const DEFAULT_MAX_TABLE_PAGES = 5;

export const ALL_PAYMENT_PERIODICITIES: PaymentPeriodicity[] = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly,
  PaymentPeriodicity.Biennial,
  PaymentPeriodicity.Lifetime,
];

export enum StateColor {
  pending = '#f8def2',
  published = '#e1f8de',
  draft = '#f8efde',
  none = 'white',
}

export function validateURL(url: string) {
  if (url) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return pattern.test(url);
  }
  return false;
}

export function flattenDOMTokenList(list: DOMTokenList) {
  let string = '';
  for (const element of Array.from(list)) {
    string = `${string} ${element}`;
  }
  return string.substring(1);
}

/**
 * Helper function to read env variable IMG_MIN_SIZE_TO_COMPRESS
 */
export function getImgMinSizeToCompress(): number {
  const { imgMinSizeToCompress } = getSettings();

  return imgMinSizeToCompress;
}

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I
  : never;

export type ValueConstructor<T> = T | (() => T);

export function isValueConstructor<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

export function isFunctionalUpdate<T>(
  value: React.SetStateAction<T>
): value is (value: T) => T {
  return typeof value === 'function';
}

export const AVAILABLE_LANG = [
  { id: 'en', lang: 'en_US', name: 'English', locale: enUS },
  { id: 'fr', lang: 'fr_FR', name: 'Français', locale: fr },
  { id: 'de', lang: 'de_CH', name: 'Deutsch', locale: de },
];
