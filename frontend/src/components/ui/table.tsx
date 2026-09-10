import * as React from 'react'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={[
          'w-full caption-bottom text-sm',
          className ?? '',
        ].join(' ')}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={className ?? ''} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={className ?? ''} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot className={['border-t bg-slate-50 font-medium', className ?? ''].join(' ')} {...props} />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={[
        'border-b border-slate-200 transition-colors hover:bg-slate-50 data-[state=selected]:bg-slate-50',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={[
        'h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-[0.14em] text-slate-500',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td className={['px-3 py-3 align-middle text-xs text-slate-700', className ?? ''].join(' ')} {...props} />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption className={['mt-4 text-xs text-slate-500', className ?? ''].join(' ')} {...props} />
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
