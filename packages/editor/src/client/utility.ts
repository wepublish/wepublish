import nanoid from 'nanoid'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {DocumentNode, OperationDefinitionNode} from 'graphql'
import {PaymentPeriodicity, SortOrder} from './api'

export enum LocalStorageKey {
  SessionToken = 'sessionToken'
}

export function generateID(): string {
  return nanoid()
}

// https://gist.github.com/mathewbyrne/1280286#gistcomment-2588056
export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]/gi, 'a')
    .replace(/[ÇĆĈČ]/gi, 'c')
    .replace(/[ÐĎĐÞ]/gi, 'd')
    .replace(/[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]/gi, 'e')
    .replace(/[ĜĞĢǴ]/gi, 'g')
    .replace(/[ĤḦ]/gi, 'h')
    .replace(/[ÌÍÎÏĨĪĮİỈỊ]/gi, 'i')
    .replace(/[Ĵ]/gi, 'j')
    .replace(/[Ĳ]/gi, 'ij')
    .replace(/[Ķ]/gi, 'k')
    .replace(/[ĹĻĽŁ]/gi, 'l')
    .replace(/[Ḿ]/gi, 'm')
    .replace(/[ÑŃŅŇ]/gi, 'n')
    .replace(/[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]/gi, 'o')
    .replace(/[Œ]/gi, 'oe')
    .replace(/[ṕ]/gi, 'p')
    .replace(/[ŔŖŘ]/gi, 'r')
    .replace(/[ßŚŜŞŠ]/gi, 's')
    .replace(/[ŢŤ]/gi, 't')
    .replace(/[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]/gi, 'u')
    .replace(/[ẂŴẀẄ]/gi, 'w')
    .replace(/[ẍ]/gi, 'x')
    .replace(/[ÝŶŸỲỴỶỸ]/gi, 'y')
    .replace(/[ŹŻŽ]/gi, 'z')
    .replace(/[·/_,:;\\']/gi, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '') //eslint-disable-line
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// https://gist.github.com/WebReflection/6076a40777b65c397b2b9b97247520f0
export function dateTimeLocalString(date: Date) {
  function prefix(i: number) {
    return (i < 10 ? '0' : '') + i
  }

  const year = date.getFullYear()
  const month = prefix(date.getMonth() + 1)
  const day = prefix(date.getDate())
  const hours = prefix(date.getHours())
  const minutes = prefix(date.getMinutes())
  const seconds = prefix(date.getSeconds())

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export function useScript(src: string, checkIfLoaded: () => boolean, crossOrigin = false) {
  if (typeof window !== 'object')
    return {
      isLoaded: false,
      isLoading: false,
      load: () => {
        /* do nothing */
      }
    }

  const scriptRef = useRef<HTMLScriptElement | null>(null)

  const [isLoading, setLoading] = useState(false)
  const [isLoaded, setLoaded] = useState(() => checkIfLoaded())

  useEffect(() => {
    if (isLoading && !isLoaded && !scriptRef.current) {
      const script = document.createElement('script')

      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => setLoaded(true)
      script.crossOrigin = crossOrigin ? 'anonymous' : null

      document.head.appendChild(script)
      scriptRef.current = script
    }
  }, [isLoading])

  const load = useCallback(() => {
    setLoading(true)
  }, [])

  return useMemo(
    () => ({
      isLoading,
      isLoaded,
      load
    }),
    [isLoading, isLoaded, load]
  )
}

export function getOperationNameFromDocument(node: DocumentNode) {
  const firstOperation = node.definitions.find(
    node => node.kind === 'OperationDefinition'
  ) as OperationDefinitionNode

  if (!firstOperation?.name?.value) throw new Error("Coulnd't find operation name.")
  return firstOperation.name.value
}

export function transformCssStringToObject(styleCustom: string): Record<string, unknown> {
  const styleRules = styleCustom.split(';')
  if (styleRules.length === 0) return {}
  return styleRules.reduce((previousValue: Record<string, unknown>, currentValue: string) => {
    const [key, value] = currentValue.split(':')
    if (key && value) {
      return Object.assign(previousValue, {[key.trim()]: value.trim()})
    }
    return previousValue
  }, {})
}

export type SortType = 'asc' | 'desc' | null
export function mapTableSortTypeToGraphQLSortOrder(sortType: SortType): SortOrder | null {
  switch (sortType) {
    case 'desc':
      return SortOrder.Descending
    case 'asc':
      return SortOrder.Ascending
    default:
      return null
  }
}

export const DEFAULT_TABLE_PAGE_SIZES = [
  {
    value: 10,
    label: 10
  },
  {
    value: 20,
    label: 20
  },
  {
    value: 50,
    label: 50
  },
  {
    value: 100,
    label: 100
  }
]

export const ALL_PAYMENT_PERIODICITIES: PaymentPeriodicity[] = [
  PaymentPeriodicity.Monthly,
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly
]
