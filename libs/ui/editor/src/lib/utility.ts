import {
  getSettings,
  PaymentPeriodicity,
  SortOrder,
} from '@wepublish/editor/api';
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

const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:']);

export function validateURL(url: string) {
  const input = url.trim();

  if (!input || hasWhitespace(input)) {
    return false;
  }

  try {
    const parsed = new URL(
      hasExplicitScheme(input) ? input : `https://${input}`
    );

    return (
      ALLOWED_URL_PROTOCOLS.has(parsed.protocol) &&
      !parsed.username &&
      !parsed.password &&
      isValidUrlHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function hasExplicitScheme(value: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function hasWhitespace(value: string) {
  return Array.from(value).some(character => character.trim() === '');
}

function isValidUrlHostname(hostname: string) {
  const normalized = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;

  if (!normalized || normalized.length > 253) {
    return false;
  }

  if (isValidIPv4Address(normalized)) {
    return true;
  }

  const labels = normalized.toLowerCase().split('.');
  const topLevelDomain = labels[labels.length - 1];

  return (
    labels.length > 1 &&
    topLevelDomain.length >= 2 &&
    Array.from(topLevelDomain).every(character =>
      isAsciiLetter(character.charCodeAt(0))
    ) &&
    labels.every(isValidDnsLabel)
  );
}

function isValidIPv4Address(hostname: string) {
  const parts = hostname.split('.');

  return (
    parts.length === 4 &&
    parts.every(part => {
      if (!part || part.length > 3) {
        return false;
      }

      if (
        !Array.from(part).every(character =>
          isAsciiDigit(character.charCodeAt(0))
        )
      ) {
        return false;
      }

      const value = Number(part);
      return Number.isInteger(value) && value >= 0 && value <= 255;
    })
  );
}

function isValidDnsLabel(label: string) {
  if (
    !label ||
    label.length > 63 ||
    label.startsWith('-') ||
    label.endsWith('-')
  ) {
    return false;
  }

  return Array.from(label).every(character => {
    const code = character.charCodeAt(0);
    return isAsciiLetter(code) || isAsciiDigit(code) || character === '-';
  });
}

function isAsciiLetter(code: number) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAsciiDigit(code: number) {
  return code >= 48 && code <= 57;
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
