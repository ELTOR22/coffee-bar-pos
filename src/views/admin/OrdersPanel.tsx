import { useState } from 'react';
import { Loader2, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { useOrders } from '../../hooks/useData';
import { formatCurrency, formatDateTime } from '../../lib/format';

export function OrdersPanel() {
  const { orders, loading, refetch } = useOrders(100);
  const [expanded, setExpanded] = useState<string | null>(null);

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
        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No orders yet. Place an order from the public menu to see it here.</p>
        <button onClick={refetch} className="mt-4 text-sm text-espresso-500 hover:text-espresso-700">Refresh</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-espresso-500">{orders.length} orders</p>
        <button onClick={refetch} className="text-sm text-espresso-500 hover:text-espresso-700">Refresh</button>
      </div>

      <div className="space-y-2">
        {orders.map((order) => {
          const isOpen = expanded === order.id;
          const total = Number(order.total);
          return (
            <div
              key={order.id}
              className="rounded-xl bg-cream-50 border border-espresso-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-cream-100/50 transition text-left"
              >
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-espresso-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-espresso-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-espresso-800 text-sm">
                      {order.table_number ? `Table ${order.table_number}` : order.customer_name || 'Walk-in'}
                    </span>
                    <span className="rounded-full bg-sage-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage-600">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-espresso-400 mt-0.5">
                    {formatDateTime(order.created_at)} · {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-display text-lg font-bold text-espresso-800">{formatCurrency(total)}</span>
              </button>

              {isOpen && order.order_items && (
                <div className="border-t border-espresso-100 px-4 py-3 bg-cream-100/30">
                  <div className="space-y-1.5">
                    {order.order_items.map((oi) => (
                      <div key={oi.id} className="flex items-center justify-between text-sm">
                        <span className="text-espresso-600">
                          <span className="font-medium text-espresso-800">{oi.quantity}×</span> {oi.menu_items?.name ?? 'Unknown item'}
                        </span>
                        <span className="text-espresso-500">{formatCurrency(Number(oi.price_at_time) * oi.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
