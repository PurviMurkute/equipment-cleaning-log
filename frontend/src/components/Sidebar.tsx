import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/', icon: GridIcon, end: true },
  { label: 'Equipment', to: '/equipment', icon: BoxIcon },
  { label: 'Cleaning Records', to: '/cleaning-records', icon: ClipboardIcon },
  { label: 'Audit Trail', to: '/audit-trail', icon: ClockIcon },
]

function GridIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="2" y="2" width="4" height="4" rx="0.75" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="2" width="4" height="4" rx="0.75" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="10" width="4" height="4" rx="0.75" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="10" width="4" height="4" rx="0.75" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function BoxIcon(_props: { active?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M2.75 5.25 8 2.75l5.25 2.5v5.75L8 13.75l-5.25-2.75V5.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 2.75v11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.75 5.25 8 8l5.25-2.75" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function ClipboardIcon(_props: { active?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3.5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 3.5V2.75h5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.25 7.25h5.5M5.25 9.75h4.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon(_props: { active?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 5v3l2 1.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const Sidebar = () => {
  return (
    <aside className="flex h-full w-full flex-col bg-[#f8f8f6] text-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
          <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M4 8.25 6.5 10.75 12 5.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold tracking-[-0.02em] text-slate-900">CleanTrack</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'flex w-full items-center gap-3 rounded-[3px] px-3 py-2 text-left text-sm transition',
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex h-4 w-4 items-center justify-center">
                      <item.icon active={isActive} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
