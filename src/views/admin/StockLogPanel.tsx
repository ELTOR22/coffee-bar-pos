import { Loader2, ScrollText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useStockLogs } from '../../hooks/useData';
import { formatNumber, formatDateTime } from '../../lib/format';

export function StockLogPanel() {
  const { logs, loading, refetch } = useStockLogs(200);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-espresso-400" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-espresso-400">
        <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No stock movements yet.</p>
        <button onClick={refetch} className="mt-4 text-sm text-espresso-500 hover:text-espresso-700">Refresh</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-espresso-500">{logs.length} movements logged</p>
        <button onClick={refetch} className="text-sm text-espresso-500 hover:text-espresso-700">Refresh</button>
      </div>

      <div className="rounded-2xl bg-cream-50 border border-espresso-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-espresso-100 bg-cream-100/50 text-left text-xs uppercase tracking-wider text-espresso-400">
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const negative = log.change_amount < 0;
                return (
                  <tr key={log.id} className="border-b border-espresso-50 last:border-0 hover:bg-cream-100/30 transition">
                    <td className="px-4 py-3 font-medium text-espresso-700">{log.ingredients?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-semibold ${negative ? 'text-rust-600' : 'text-sage-600'}`}>
                        {negative ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                        {log.change_amount > 0 ? '+' : ''}{formatNumber(log.change_amount)} {log.ingredients?.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        log.reason === 'sale' ? 'bg-espresso-700/10 text-espresso-700' :
                        log.reason === 'restock' ? 'bg-sage-500/10 text-sage-600' :
                        log.reason === 'waste' ? 'bg-rust-500/10 text-rust-600' :
                        'bg-gold-500/10 text-gold-600'
                      }`}>
                        {log.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-espresso-400 max-w-[200px] truncate">{log.note || '—'}</td>
                    <td className="px-4 py-3 text-right text-espresso-400 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
