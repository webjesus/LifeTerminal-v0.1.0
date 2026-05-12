import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../Modal'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import type { ProjectWorkspaceBlock, ProjectWorkspaceRelation, ProjectWorkspaceRelationType } from '../../types'
import { projectWorkspaceRelationOptions } from './projectMeta'

type ProjectAddRelationSheetProps = {
  isOpen: boolean
  onClose: () => void
  blocks: ProjectWorkspaceBlock[]
  initialFromBlockId?: string | null
  initialToBlockId?: string | null
  initialType?: ProjectWorkspaceRelationType
  initialLabel?: string
  submitLabel?: string
  existingRelations?: ProjectWorkspaceRelation[]
  onSubmit: (values: {
    fromBlockId: string
    toBlockId: string
    type: ProjectWorkspaceRelationType
    label?: string
  }) => void
}

export function ProjectAddRelationSheet({
  isOpen,
  onClose,
  blocks,
  initialFromBlockId = null,
  initialToBlockId = null,
  initialType = 'related',
  initialLabel = '',
  submitLabel = 'Сохранить связь',
  existingRelations = [],
  onSubmit,
}: ProjectAddRelationSheetProps) {
  useLockBodyScroll(isOpen)

  const [fromBlockId, setFromBlockId] = useState(initialFromBlockId ?? '')
  const [toBlockId, setToBlockId] = useState(initialToBlockId ?? '')
  const [relationType, setRelationType] = useState<ProjectWorkspaceRelationType>(initialType)
  const [label, setLabel] = useState(initialLabel)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFromBlockId(initialFromBlockId ?? '')
    setToBlockId(initialToBlockId ?? '')
    setRelationType(initialType)
    setLabel(initialLabel)
  }, [initialFromBlockId, initialLabel, initialToBlockId, initialType, isOpen])

  const availableToBlocks = useMemo(
    () => blocks.filter((block) => block.id !== fromBlockId),
    [blocks, fromBlockId],
  )

  const hasEnoughBlocks = blocks.length >= 2

  const duplicateRelation = useMemo(
    () => existingRelations.find((relation) => relation.fromBlockId === fromBlockId && relation.toBlockId === toBlockId && relation.type === relationType),
    [existingRelations, fromBlockId, relationType, toBlockId],
  )

  const isInvalid = !hasEnoughBlocks || !fromBlockId || !toBlockId || fromBlockId === toBlockId || Boolean(duplicateRelation)

  return (
    <Modal
      title="Создать связь"
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      footer={(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-(--text-muted)">
            {hasEnoughBlocks
              ? 'Связь управляет структурой проекта и не удаляет сами блоки.'
              : 'Сначала добавьте минимум два блока в рабочую область проекта.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onClose} className="ui-button px-4 py-3 text-sm">
              Отмена
            </button>
            <button
              type="button"
              disabled={isInvalid}
              onClick={() => {
                if (isInvalid) {
                  return
                }

                onSubmit({
                  fromBlockId,
                  toBlockId,
                  type: relationType,
                  label: label.trim() || undefined,
                })
                onClose()
              }}
              className="ui-button-accent px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    >
      {!hasEnoughBlocks ? (
        <div className="rounded-3xl border border-dashed border-(--border) bg-(--panel-elevated) px-6 py-12 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-(--text-muted)">Связи</p>
          <h3 className="mt-3 text-xl font-semibold text-(--text-primary)">Для создания связи нужно минимум два блока в рабочей области.</h3>
          <p className="mt-3 text-sm text-(--text-muted)">Добавьте ещё один блок, затем вернитесь к созданию связи.</p>
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Откуда</span>
          <select value={fromBlockId} onChange={(event) => setFromBlockId(event.target.value)} className="ui-select">
            <option value="">Выберите блок</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>{block.title}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Куда</span>
          <select value={toBlockId} onChange={(event) => setToBlockId(event.target.value)} className="ui-select">
            <option value="">Выберите блок</option>
            {availableToBlocks.map((block) => (
              <option key={block.id} value={block.id}>{block.title}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Тип связи</span>
          <select value={relationType} onChange={(event) => setRelationType(event.target.value as ProjectWorkspaceRelationType)} className="ui-select">
            {projectWorkspaceRelationOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-(--text-muted)">Подпись связи</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="ui-input"
            placeholder="Комментарий или уточнение связи"
          />
        </label>

        {duplicateRelation ? (
          <div className="sm:col-span-2 rounded-2xl border border-(--border-soft) bg-(--panel-elevated) p-3 text-sm text-(--text-secondary)">
            Такая связь уже существует. Измените направление или выберите другой тип связи.
          </div>
        ) : null}
      </div>
      )}
    </Modal>
  )
}