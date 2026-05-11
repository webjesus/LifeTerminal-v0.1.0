import { useNavigate } from 'react-router-dom'
import { Modal } from '../Modal'
import { QuickAddInput, type QuickAddResult } from './QuickAddInput'

type QuickAddModalProps = {
  isOpen: boolean
  onClose: () => void
}

function getRouteForResult(result: QuickAddResult) {
  switch (result.kind) {
    case 'task':
      return '/tasks'
    case 'note':
      return '/notes'
    case 'idea':
      return '/ideas'
    case 'goal':
      return '/settings'
    case 'reminder':
      return '/reminders'
    default:
      return '/'
  }
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const navigate = useNavigate()

  return (
    <Modal
      title="Quick Capture"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-(--text-muted)">
          <p>Все данные сохраняются локально (localStorage). Связи можно настраивать в карточках объектов.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-(--border) bg-(--panel) px-3 py-2 font-medium text-(--text-muted) transition-colors hover:border-(--accent) hover:text-(--text-primary)"
          >
            Закрыть
          </button>
        </div>
      }
    >
      <QuickAddInput
        onCreated={(result) => {
          onClose()
          navigate(getRouteForResult(result))
        }}
      />
    </Modal>
  )
}

