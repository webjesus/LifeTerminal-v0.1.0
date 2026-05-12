import { useMemo, useState, type KeyboardEvent } from 'react'
import { normalizeTag } from '../../utils/tags'

type TagInputProps = {
  label: string
  value: string[]
  suggestions?: string[]
  disabled?: boolean
  placeholder?: string
  onChange: (tags: string[]) => void
}

export function TagInput({
  label,
  value,
  suggestions = [],
  disabled,
  placeholder = 'Добавьте тег и нажмите Enter',
  onChange,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const normalizedSuggestions = useMemo(
    () => suggestions.filter((tag) => !value.includes(tag)),
    [suggestions, value],
  )

  function addTag(rawTag: string) {
    const normalizedTag = normalizeTag(rawTag)

    if (!normalizedTag || value.includes(normalizedTag)) {
      return
    }

    onChange([...value, normalizedTag])
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== ',') {
      return
    }

    event.preventDefault()
    addTag(inputValue)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-(--text-secondary)">{label}</label>
      <div className="rounded-2xl border border-(--border) bg-(--panel-elevated) p-3">
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-(--warning-border) bg-(--warning-bg) px-3 py-1 text-xs text-(--warning-text)">
              #{tag}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full border border-current px-1 leading-none"
                  aria-label={`Удалить тег ${tag}`}
                >
                  x
                </button>
              ) : null}
            </span>
          ))}
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="min-w-36 flex-1 border-none bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted) disabled:cursor-not-allowed"
            placeholder={placeholder}
          />
        </div>
      </div>

      {normalizedSuggestions.length > 0 && !disabled ? (
        <div className="flex flex-wrap gap-2">
          {normalizedSuggestions.slice(0, 15).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="ui-chip"
            >
              #{tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
