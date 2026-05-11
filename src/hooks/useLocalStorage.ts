import { useEffect, useRef, useState } from 'react'
import { getStorageItem, setStorageItem, STORAGE_CHANGE_EVENT } from '../utils/storage'

type UseLocalStorageResult<T> = {
  value: T
  setValue: (value: T | ((previousValue: T) => T)) => void
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageResult<T> {
  const initialValueRef = useRef(initialValue)
  const [storedValue, setStoredValue] = useState<T>(() => getStorageItem(key, initialValue))
  const valueRef = useRef(storedValue)

  useEffect(() => {
    valueRef.current = storedValue
  }, [storedValue])

  useEffect(() => {
    const nextValue = getStorageItem(key, initialValueRef.current)
    valueRef.current = nextValue
    setStoredValue(nextValue)
  }, [key])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) {
        return
      }

      const nextValue = getStorageItem(key, initialValueRef.current)
      valueRef.current = nextValue
      setStoredValue(nextValue)
    }

    const handleLocalUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>

      if (customEvent.detail?.key !== key) {
        return
      }

      const nextValue = getStorageItem(key, initialValueRef.current)
      valueRef.current = nextValue
      setStoredValue(nextValue)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(STORAGE_CHANGE_EVENT, handleLocalUpdate)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleLocalUpdate)
    }
  }, [key])

  const setValue = (value: T | ((previousValue: T) => T)) => {
    const nextValue =
      value instanceof Function ? value(valueRef.current) : value

    valueRef.current = nextValue
    setStoredValue(nextValue)

    setStorageItem(key, nextValue)
  }

  return {
    value: storedValue,
    setValue,
  }
}