import Dialog from '../ui/dialog'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  pending?: boolean
  error?: string
  destructive?: boolean
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  pending = false,
  error,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onClose} closeDisabled={pending}>
      <p>{description}</p>
      {error && <p role="alert" className="mt-4 rounded-control bg-danger-soft p-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex justify-end gap-3" aria-busy={pending}>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={pending}
          className="rounded-control border border-input-border px-4 py-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={`rounded-control px-4 py-2 font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary-hover'}`}
        >
          {pending ? 'Saving…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
