import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type PopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Popover({ open, onOpenChange, children }: PopoverProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const root = document.querySelector('[data-popover-root="true"]')

      if (root && !root.contains(target)) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, onOpenChange])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50" data-popover-root="true">
      {children}
    </div>,
    document.body,
  )
}

function PopoverTrigger({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}

function PopoverContent({
  className,
  children,
  align = 'start',
  sideOffset = 8,
}: {
  className?: string
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const offsetStyle =
    sideOffset > 0 ? { top: `calc(100% + ${sideOffset}px)` } : { top: '100%' }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      style={offsetStyle}
      className={[
        'absolute z-50 min-w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-xl',
        align === 'center' ? 'left-1/2 -translate-x-1/2' : '',
        align === 'end' ? 'right-0' : '',
        align === 'start' ? 'left-0' : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
