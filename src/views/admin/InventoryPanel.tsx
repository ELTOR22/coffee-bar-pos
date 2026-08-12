import { useMemo, useState } from 'react';
import { Plus, Minus, Package, AlertTriangle, Loader2, History } from 'lucide-react';
import { useIngredients, useStockLogs, adjustStock } from '../../hooks/useData';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { formatNumber, formatDateTime } from '../../lib/format';
import type { Ingredient } from '../../types';

export function InventoryPanel() {
  const { ingredients, loading, refetch } = useIngredients();
  const { logs, refetch: refetchLogs } = useStockLogs(50);
  const { notify } = useToast();

  const [adjusting, setAdjusting] = useState<Ingredient | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('restock');
  const [adjustNote, setAdjustNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const lowStock = useMemo(
    () => ingredients.filter((i) => i.quantity_on_hand <= i.reorder_threshold),
    [ingredients]
  );

  function openAdjust(ing: Ingredient) {
    setAdjusting(ing);
    setAdjustAmount('');
    setAdjustReason('restock');
    setAdjustNote('');
  }

  async function handleAdjust() {
    if (!adjusting) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      notify('Enter a valid amount', 'error');
      return;
    }
    setSaving(true);
    try {
      await adjustStock(adjusting.id, amount, adjustReason, adjustNote);
      notify(`${adjusting.name} updated by ${amount > 0 ? '+' : ''}${formatNumber(amount)} ${adjusting.unit}`);
      await Promise.all([refetch(), refetchLogs()]);
      setAdjusting(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update stock';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-espresso-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <div className="rounded-2xl bg-gold-500/10 border border-gold-400/40 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-gold-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-espresso-800">{lowStock.length} ingredient{lowStock.length > 1 ? 's' : ''} below reorder threshold</p>
            <p className="text-sm text-espresso-500 mt-0.5">
              {lowStock.map((i) => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-espresso-500">{ingredients.length} ingredients tracked</p>
        <button
          onClick={() => {
            refetch();
            refetchLogs();
            setShowLogs(false);
          }}
          className="text-sm text-espresso-500 hover:text-espresso-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ing) => {
          const isLow = ing.quantity_on_hand <= ing.reorder_threshold;
          const pct = Math.min(100, Math.max(0, (ing.quantity_on_hand / (ing.reorder_threshold * 3 || 100)) * 100));
          return (
            <div
              key={ing.id}
              className={`rounded-2xl bg-cream-50 border p-5 shadow-sm transition ${
                isLow ? 'border-gold-400/50' : 'border-espresso-100'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isLow ? 'bg-gold-500/15 text-gold-600' : 'bg-espresso-700/10 text-espresso-700'}`}>
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-espresso-800 text-sm">{ing.name}</h3>
                    <p className="text-xs text-espresso-400">in {ing.unit}</p>
                  </div>
                </div>
                {isLow && (
                  <span className="flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-600">
                    <AlertTriangle className="h-3 w-3" /> Low
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-2xl font-bold text-espresso-800">{formatNumber(ing.quantity_on_hand)}</span>
                  <span className="text-sm text-espresso-400">{ing.unit}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-espresso-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? 'bg-gold-500' : 'bg-sage-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-espresso-400 mt-1">Reorder at {formatNumber(ing.reorder_threshold)} {ing.unit}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdjustReason('restock');
                    setAdjustAmount(String(ing.reorder_threshold * 2));
                    openAdjust(ing);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-espresso-700 py-2 text-sm font-medium text-cream-50 hover:bg-espresso-800 transition"
                >
                  <Plus className="h-4 w-4" /> Restock
                </button>
                <button
                  onClick={() => openAdjust(ing)}
                  className="flex items-center justify-center rounded-lg border border-espresso-200 px-3 py-2 text-sm font-medium text-espresso-600 hover:bg-espresso-50 transition"
                >
                  Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowLogs(true)}
        className="flex items-center gap-2 text-sm font-medium text-espresso-600 hover:text-espresso-800 transition"
      >
        <History className="h-4 w-4" /> View stock movement log ({logs.length})
      </button>

      {/* Adjust modal */}
      <Modal
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        title={adjusting ? `Adjust: ${adjusting.name}` : ''}
        size="sm"
      >
        {adjusting && (
          <div className="space-y-4">
            <div className="rounded-lg bg-cream-100 p-3 text-sm text-espresso-600">
              Current: <span className="font-semibold">{formatNumber(adjusting.quantity_on_hand)} {adjusting.unit}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">Reason</label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
              >
                <option value="restock">Restock</option>
                <option value="waste">Waste</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">
                Amount ({adjusting.unit}) — use negative for usage/waste
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustAmount((v) => String((parseFloat(v) || 0) - 10))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-espresso-200 text-espresso-600 hover:bg-espresso-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                />
                <button
                  onClick={() => setAdjustAmount((v) => String((parseFloat(v) || 0) + 10))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-espresso-200 text-espresso-600 hover:bg-espresso-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-1.5">Note (optional)</label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="e.g. new delivery from supplier"
                className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
              />
            </div>
            <button
              onClick={handleAdjust}
              disabled={saving}
              className="w-full rounded-xl bg-espresso-700 py-2.5 font-semibold text-cream-50 hover:bg-espresso-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save adjustment'}
            </button>
          </div>
        )}
      </Modal>

      {/* Stock log modal */}
      <Modal open={showLogs} onClose={() => setShowLogs(false)} title="Stock Movement Log" size="lg">
        {logs.length === 0 ? (
          <p className="text-sm text-espresso-400">No stock movements recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-espresso-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      log.change_amount < 0 ? 'bg-rust-500/10 text-rust-600' : 'bg-sage-500/10 text-sage-600'
                    }`}
                  >
                    {log.change_amount < 0 ? '−' : '+'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-espresso-700">{log.ingredients?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-espresso-400 capitalize">
                      {log.reason}{log.note ? ` · ${log.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${log.change_amount < 0 ? 'text-rust-600' : 'text-sage-600'}`}>
                    {log.change_amount > 0 ? '+' : ''}{formatNumber(log.change_amount)}
                  </p>
                  <p className="text-xs text-espresso-400">{formatDateTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
