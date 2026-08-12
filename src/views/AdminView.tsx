import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Coffee,
  Package,
  ClipboardList,
  ScrollText,
  BarChart3,
  LogOut,
  ShoppingCart,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DashboardPanel } from '../views/admin/DashboardPanel';
import { MenuPanel } from '../views/admin/MenuPanel';
import { InventoryPanel } from '../views/admin/InventoryPanel';
import { OrdersPanel } from '../views/admin/OrdersPanel';
import { StockLogPanel } from '../views/admin/StockLogPanel';
import { ReportsPanel } from '../views/admin/ReportsPanel';

type Tab = 'dashboard' | 'menu' | 'inventory' | 'orders' | 'logs' | 'reports';

const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu', icon: Coffee },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'logs', label: 'Stock Logs', icon: ScrollText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export function AdminView({ onSwitchToCashier }: { onSwitchToCashier?: () => void }) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const current = useMemo(() => NAV.find((n) => n.id === tab)!, [tab]);

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-60 shrink-0 bg-espresso-800 text-cream-100 flex flex-col transition-transform ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-espresso-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-espresso-900 font-display font-bold">
            B
          </div>
          <div>
            <p className="font-display font-bold leading-none">Brewhouse</p>
            <p className="text-[10px] uppercase tracking-widest text-espresso-300">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  tab === item.id
                    ? 'bg-espresso-600 text-cream-50'
                    : 'text-espresso-200 hover:bg-espresso-700/60'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User info + actions */}
        <div className="p-3 border-t border-espresso-700 space-y-1">
          {onSwitchToCashier && (
            <button
              onClick={onSwitchToCashier}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-espresso-200 hover:bg-espresso-700/60 transition"
            >
              <ShoppingCart className="h-4 w-4" /> Switch to Cashier
            </button>
          )}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-espresso-200 hover:bg-espresso-700/60 transition"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-espresso-900/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-espresso-200 bg-cream-50/90 backdrop-blur px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden rounded-lg p-2 text-espresso-600 hover:bg-espresso-100"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl font-bold text-espresso-800">{current.label}</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso-700 text-cream-50">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-espresso-700 leading-tight">
                  {user.full_name || user.email}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-espresso-400">Admin</p>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {tab === 'dashboard' && <DashboardPanel onNavigate={setTab} />}
          {tab === 'menu' && <MenuPanel />}
          {tab === 'inventory' && <InventoryPanel />}
          {tab === 'orders' && <OrdersPanel />}
          {tab === 'logs' && <StockLogPanel />}
          {tab === 'reports' && <ReportsPanel />}
        </main>
      </div>
    </div>
  );
}
