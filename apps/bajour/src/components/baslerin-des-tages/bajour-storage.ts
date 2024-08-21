import {useState, useEffect} from 'react'

export class BajourStorage {
  constructor(private name: string) {}

  private getStorageData(): string[] {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem(this.name) || '[]')
    }
    return []
  }

  private setStorageData(data: string[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.name, JSON.stringify(data))
    }
  }

  public all() {
    return this.getStorageData()
  }

  public add(item: string) {
    const current = this.getStorageData()
    const newValues = [...current, item]
    this.setStorageData(newValues)
  }

  public remove(item: string) {
    const current = this.getStorageData()
    const newValues = current.filter((value: string) => value !== item)
    this.setStorageData(newValues)
  }

  public exists(item: string): boolean {
    const current = this.getStorageData()
    return current.includes(item)
  }
}

export function useBajourStorage(name: string) {
  const [storage] = useState(() => new BajourStorage(name))
  const [data, setData] = useState<string[]>([])

  useEffect(() => {
    setData(storage.all())
  }, [storage])

  const add = (item: string) => {
    storage.add(item)
    setData(storage.all())
  }

  const remove = (item: string) => {
    storage.remove(item)
    setData(storage.all())
  }

  const exists = (item: string) => storage.exists(item)

  return {data, add, remove, exists}
}
