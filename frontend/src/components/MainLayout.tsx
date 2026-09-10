import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const MainLayout = () => {
  return (
    <div className="h-screen overflow-hidden bg-[#f5f6f8] text-slate-900">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col lg:flex-row">
        <div className="w-full shrink-0 lg:h-full lg:w-[290px] lg:border-r lg:border-slate-200">
          <Sidebar />
        </div>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
          <section className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 lg:px-6 lg:py-5">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
