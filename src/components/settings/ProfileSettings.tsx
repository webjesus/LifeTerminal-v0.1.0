import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Trash2, UserRound } from 'lucide-react'
import { useAppSettings } from '../../settings/useAppSettings'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'LT'
}

export function ProfileSettings() {
  const { settings, saveProfile } = useAppSettings()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState(settings.profile.name)
  const [avatar, setAvatar] = useState<string | null>(settings.profile.avatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const initials = useMemo(() => getInitials(name || settings.profile.name), [name, settings.profile.name])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result)
        setError(null)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function handleSave() {
    const normalizedName = name.trim()

    if (!normalizedName) {
      setError('Имя не может быть пустым.')
      return
    }

    saveProfile({
      name: normalizedName,
      avatarUrl: avatar,
    })
    setError(null)
    setStatus('Сохранено')
  }

  return (
    <section id="profile" className="ui-panel p-4 sm:p-5 md:p-6">
      <div className="ui-settings-section-header">
        <span className="ui-settings-section-icon">
          <UserRound size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Профиль</p>
          <h2 className="mt-1 text-xl font-semibold text-(--text-primary)">Настройки профиля</h2>
          <p className="page-description mt-2 max-w-2xl text-sm leading-5 text-(--text-muted)">Обновите имя и фотографию профиля. Эти настройки сохраняются локально на устройстве.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-(--accent-border) bg-(--accent-soft) text-xl font-semibold text-(--accent) sm:h-24 sm:w-24">
            {avatar ? (
              <img src={avatar} alt="Аватар пользователя" className="h-full w-full object-cover" />
            ) : initials ? (
              <span>{initials}</span>
            ) : (
              <UserRound size={28} strokeWidth={2} />
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ui-button inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 sm:w-auto"
            >
              <ImagePlus size={18} strokeWidth={2} />
              Изменить фото
            </button>
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="ui-button-danger inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 sm:w-auto"
            >
              <Trash2 size={18} strokeWidth={2} />
              Удалить фото
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="ui-settings-field">
            <label className="mb-2 block text-sm font-medium text-(--text-primary)" htmlFor="profile-name">
              Имя пользователя
            </label>
            <p className="mb-3 text-sm leading-5 text-(--text-muted)">Это имя отображается в приветствии и в настройках приложения.</p>
            <input
              id="profile-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setStatus(null)
              }}
              className="ui-input"
              placeholder="Пользователь"
            />
            {error ? <p className="mt-2 text-sm text-(--danger-text)">{error}</p> : null}
            {status ? <p className="mt-2 text-sm text-(--success-text)">{status}</p> : null}
          </div>

          <div className="flex items-center justify-stretch sm:justify-end">
            <button type="button" onClick={handleSave} className="ui-button-accent w-full px-5 py-2.5 sm:w-auto">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}