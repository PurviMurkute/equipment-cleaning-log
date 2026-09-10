import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 isolate">
      <DialogOverlay onOpenChange={onOpenChange} />
      {children}
    </div>,
    document.body,
  )
}

function DialogOverlay({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label="Close dialog overlay"
      className="absolute inset-0 z-0 cursor-default bg-slate-950/30 backdrop-blur-md backdrop-saturate-150"
      onClick={() => onOpenChange(false)}
    />
  )
}

function DialogContent({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ width: '480px', maxWidth: 'calc(100vw - 2rem)' }}
      className={[
        'relative z-10 flex-none rounded-xl border border-slate-200 bg-white p-5 shadow-2xl',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}

function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-slate-900">{children}</h2>
}

function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-600">{children}</p>
}

function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex items-center justify-end gap-2">{children}</div>
}

function DialogClose({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose }
