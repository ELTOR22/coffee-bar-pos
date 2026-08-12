import { useMemo } from 'react';
import { TrendingUp, Award, Calendar, Loader2, BarChart3 } from 'lucide-react';
import { useOrders } from '../../hooks/useData';
import { formatCurrency, formatNumber, formatDate } from '../../lib/format';

export function ReportsPanel() {
  const { orders, loading } = useOrders(500);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalItems = orders.reduce(
      (s, o) => s + (o.order_items?.reduce((q, oi) => q + oi.quantity, 0) ?? 0),
      0
    );

    // Best sellers
    const itemSales = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const oi of o.order_items ?? []) {
        const key = oi.menu_item_id;
        const existing = itemSales.get(key);
        const revenue = Number(oi.price_at_time) * oi.quantity;
        if (existing) {
          existing.qty += oi.quantity;
          existing.revenue += revenue;
        } else {
          itemSales.set(key, { name: oi.menu_items?.name ?? 'Unknown', qty: oi.quantity, revenue });
        }
      }
    }
    const bestSellers = [...itemSales.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
    const maxQty = bestSellers[0]?.qty ?? 1;

    // Revenue by day (last 7)
    const byDay = new Map<string, { revenue: number; count: number }>();
    for (const o of orders) {
      const day = new Date(o.created_at).toDateString();
      const existing = byDay.get(day);
      if (existing) {
        existing.revenue += Number(o.total);
        existing.count += 1;
      } else {
        byDay.set(day, { revenue: Number(o.total), count: 1 });
      }
    }
    const days: { label: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const data = byDay.get(key);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: data?.revenue ?? 0,
        count: data?.count ?? 0,
      });
    }
    const maxDayRevenue = Math.max(...days.map((d) => d.revenue), 1);

    return { totalRevenue, totalItems, bestSellers, maxQty, days, maxDayRevenue, avgOrder: orders.length ? totalRevenue / orders.length : 0 };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-espresso-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-espresso-400">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No sales data yet. Place orders from the public menu to see reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-sage-600 bg-sage-500/10' },
          { label: 'Total Orders', value: formatNumber(orders.length), icon: Calendar, color: 'text-espresso-700 bg-espresso-700/10' },
          { label: 'Items Sold', value: formatNumber(stats.totalItems), icon: BarChart3, color: 'text-gold-600 bg-gold-500/10' },
          { label: 'Avg. Order', value: formatCurrency(stats.avgOrder), icon: Award, color: 'text-rust-600 bg-rust-500/10' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-cream-50 border border-espresso-100 p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-display text-2xl font-bold text-espresso-800">{s.value}</p>
              <p className="text-sm text-espresso-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="rounded-2xl bg-cream-50 border border-espresso-100 p-5 shadow-sm">
          <h3 className="font-semibold text-espresso-800 mb-1">Revenue — Last 7 Days</h3>
          <p className="text-xs text-espresso-400 mb-5">Daily revenue from all completed orders</p>
          <div className="flex items-end justify-between gap-2 h-40">
            {stats.days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t-lg bg-espresso-600 hover:bg-espresso-700 transition-all relative group-hover:scale-y-105 origin-bottom"
                    style={{ height: `${(d.revenue / stats.maxDayRevenue) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-espresso-800 px-1.5 py-0.5 text-[10px] text-cream-50">
                      {formatCurrency(d.revenue)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-espresso-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Best sellers */}
        <div className="rounded-2xl bg-cream-50 border border-espresso-100 p-5 shadow-sm">
          <h3 className="font-semibold text-espresso-800 mb-1">Best Sellers</h3>
          <p className="text-xs text-espresso-400 mb-5">Top items by quantity sold</p>
          <div className="space-y-2.5">
            {stats.bestSellers.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-espresso-700">
                    <span className="text-espresso-400 mr-2">#{idx + 1}</span>
                    {item.name}
                  </span>
                  <span className="text-espresso-500">
                    {item.qty} sold · <span className="font-semibold text-espresso-700">{formatCurrency(item.revenue)}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-espresso-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-espresso-500 to-gold-500 transition-all"
                    style={{ width: `${(item.qty / stats.maxQty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders list */}
      <div className="rounded-2xl bg-cream-50 border border-espresso-100 p-5 shadow-sm">
        <h3 className="font-semibold text-espresso-800 mb-4">Recent Orders</h3>
        <div className="space-y-1">
          {orders.slice(0, 10).map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-espresso-50 last:border-0 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium text-espresso-700">
                  {o.table_number ? `Table ${o.table_number}` : o.customer_name || 'Walk-in'}
                </span>
                <span className="text-xs text-espresso-400">{formatDate(o.created_at)}</span>
              </div>
              <span className="font-semibold text-espresso-800">{formatCurrency(Number(o.total))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
