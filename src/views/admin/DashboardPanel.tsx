// import { useEffect, useState } from 'react';
import { TrendingUp, Package, AlertTriangle, DollarSign, ArrowRight, Clock } from 'lucide-react';
import { useIngredients, useMenuItems, useOrders, useStockLogs } from '../../hooks/useData';
import { formatCurrency, formatNumber, relativeTime } from '../../lib/format';

type Tab = 'dashboard' | 'menu' | 'inventory' | 'orders' | 'logs' | 'reports';

export function DashboardPanel({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { items } = useMenuItems();
  const { ingredients } = useIngredients();
  const { orders } = useOrders(20);
  const { logs } = useStockLogs(5);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const lowStock = ingredients.filter((i) => i.quantity_on_hand <= i.reorder_threshold);
  const soldOut = items.filter((i) => !i.is_available);

  const stats = [
    {
      label: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      sub: `${todayOrders.length} orders today`,
      icon: DollarSign,
      color: 'bg-sage-500/10 text-sage-600',
    },
    {
      label: 'Total Orders',
      value: formatNumber(orders.length),
      sub: `${formatCurrency(orders.reduce((s, o) => s + Number(o.total), 0))} all-time`,
      icon: TrendingUp,
      color: 'bg-espresso-700/10 text-espresso-700',
    },
    {
      label: 'Low Stock',
      value: formatNumber(lowStock.length),
      sub: lowStock.length > 0 ? 'Needs restocking' : 'All good',
      icon: AlertTriangle,
      color: 'bg-gold-500/10 text-gold-600',
    },
    {
      label: 'Sold Out Items',
      value: formatNumber(soldOut.length),
      sub: `${items.length - soldOut.length} available`,
      icon: Package,
      color: 'bg-rust-500/10 text-rust-600',
    },
  ];

  const cards = [
    { tab: 'inventory' as Tab, title: 'Manage Inventory', desc: 'Restock ingredients, set thresholds, adjust quantities', icon: Package },
    { tab: 'menu' as Tab, title: 'Edit Menu', desc: 'Add or update items, build recipes, toggle availability', icon: TrendingUp },
    { tab: 'reports' as Tab, title: 'View Reports', desc: 'Sales breakdown, best sellers, revenue trends', icon: DollarSign },
    { tab: 'orders' as Tab, title: 'Order History', desc: 'Browse past orders and line items', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-cream-50 border border-espresso-100 p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-espresso-800">{s.value}</p>
              <p className="text-sm text-espresso-500 mt-0.5">{s.label}</p>
              <p className="text-xs text-espresso-400 mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl bg-gold-500/10 border border-gold-400/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-gold-600" />
            <h3 className="font-semibold text-espresso-800">Low Stock Alerts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((ing) => (
              <button
                key={ing.id}
                onClick={() => onNavigate('inventory')}
                className="rounded-lg bg-cream-50 border border-gold-400/30 px-3 py-1.5 text-sm text-espresso-700 hover:border-gold-500 transition"
              >
                {ing.name} — {formatNumber(ing.quantity_on_hand)} {ing.unit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.tab}
              onClick={() => onNavigate(c.tab)}
              className="group flex items-center gap-4 rounded-2xl bg-cream-50 border border-espresso-100 p-5 text-left hover:shadow-md hover:border-espresso-200 transition"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-espresso-700 text-cream-50">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-espresso-800">{c.title}</h3>
                <p className="text-sm text-espresso-500">{c.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-espresso-300 group-hover:text-espresso-600 group-hover:translate-x-1 transition" />
            </button>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl bg-cream-50 border border-espresso-100 p-5 shadow-sm">
        <h3 className="font-semibold text-espresso-800 mb-4">Recent Stock Movements</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-espresso-400">No stock movements yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-espresso-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      log.change_amount < 0 ? 'bg-rust-500/10 text-rust-600' : 'bg-sage-500/10 text-sage-600'
                    }`}
                  >
                    {log.change_amount < 0 ? '−' : '+'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-espresso-700">
                      {log.ingredients?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-espresso-400 capitalize">{log.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${log.change_amount < 0 ? 'text-rust-600' : 'text-sage-600'}`}>
                    {log.change_amount > 0 ? '+' : ''}{formatNumber(log.change_amount)}
                  </p>
                  <p className="text-xs text-espresso-400">{relativeTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
