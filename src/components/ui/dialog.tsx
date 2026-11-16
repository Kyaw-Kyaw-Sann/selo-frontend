import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

type DialogProps = {
  title: string
  children: ReactNode
  onClose: () => void
  closeDisabled?: boolean
}

export default function Dialog({
  title,
  children,
  onClose,
  closeDisabled = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousFocus = document.activeElement

    dialog.showModal()

    return () => {
      dialog.close()

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      } else {
        // Edit ပြီး filter ထဲက မူလ row ပျောက်သွားလျှင် content ဆီ ပြန်ပို့သည်။
        document.getElementById('main-content')?.focus()
      }
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-panel border border-border bg-surface p-6 text-body shadow-lg backdrop:bg-black/30"
      onCancel={(event) => {
        event.preventDefault()
        if (!closeDisabled) onClose()
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold text-heading">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="rounded-control px-2 py-1 text-sm hover:bg-surface-muted disabled:opacity-50"
        >
          Close
        </button>
      </div>

      {children}
    </dialog>
  )
}
