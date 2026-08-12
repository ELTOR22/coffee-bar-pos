import { useEffect, useMemo, useState } from 'react';
import { Coffee, Plus, Minus, ShoppingBag, X, CheckCircle2, Loader2, LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCategories, useMenuItems, placeOrder } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../lib/format';
import type { CartItem, MenuItemWithCategory } from '../types';

export function MenuView({ onSwitchToAdmin }: { onSwitchToAdmin?: () => void }) {
  const { user, signOut } = useAuth();
  const { categories, loading: catLoading } = useCategories();
  const { items, loading: itemsLoading, refetch } = useMenuItems();
  const { notify } = useToast();

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ total: number } | null>(null);

  useEffect(() => {
    if (!activeSlug && categories.length > 0) {
      setActiveSlug(categories[0].slug);
    }
  }, [categories, activeSlug]);

  const availableItems = useMemo(() => items.filter((i) => i.is_available), [items]);
  const soldOutItems = useMemo(() => items.filter((i) => !i.is_available), [items]);

  const filteredItems = useMemo(() => {
    if (!activeSlug) return availableItems;
    return availableItems.filter((i) => i.category?.slug === activeSlug);
  }, [availableItems, activeSlug]);

  const filteredSoldOut = useMemo(() => {
    if (!activeSlug) return soldOutItems;
    return soldOutItems.filter((i) => i.category?.slug === activeSlug);
  }, [soldOutItems, activeSlug]);

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  function addToCart(item: MenuItemWithCategory) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === id ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== id));
  }

  async function handlePlaceOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const result = await placeOrder(
        tableNumber,
        customerName,
        cart.map((c) => ({ menu_item_id: c.menuItem.id, quantity: c.quantity }))
      );
      setOrderSuccess({ total: result.total });
      setCart([]);
      setCartOpen(false);
      setTableNumber('');
      setCustomerName('');
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Order failed';
      notify(message, 'error');
    } finally {
      setPlacing(false);
    }
  }

  const loading = catLoading || itemsLoading;

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-espresso-200/60 bg-cream-50/85 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso-700 text-cream-50">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold leading-none text-espresso-800">Brewhouse</h1>
                <p className="text-[10px] uppercase tracking-widest text-espresso-400">Point of Sale</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <div className="hidden sm:block text-right mr-1">
                  <p className="text-sm font-medium text-espresso-700 leading-tight">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-espresso-400">Cashier</p>
                </div>
              )}
              {onSwitchToAdmin && (
                <button
                  onClick={onSwitchToAdmin}
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-espresso-200 px-4 py-2 text-sm font-medium text-espresso-600 hover:bg-espresso-50 transition"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => setCartOpen(true)}
                className="relative rounded-full bg-espresso-700 p-2.5 text-cream-50 hover:bg-espresso-800 transition shadow-sm"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-espresso-900 animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => signOut()}
                className="rounded-full p-2.5 text-espresso-500 hover:bg-espresso-100 transition"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden bg-espresso-800 text-cream-50">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(212,168,87,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(200,112,74,0.3), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-400 mb-3">Freshly brewed daily</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Take an Order
          </h2>
          <p className="mt-3 text-espresso-200 max-w-md mx-auto text-sm sm:text-base">
            Browse the menu, add items to the cart, and place the order. Stock updates automatically.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <nav className="sticky top-16 z-30 border-b border-espresso-200/60 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveSlug(cat.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  activeSlug === cat.slug
                    ? 'bg-espresso-700 text-cream-50'
                    : 'text-espresso-500 hover:bg-espresso-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Items grid */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-espresso-400" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item, idx) => (
                <article
                  key={item.id}
                  className="group animate-fade-in-up overflow-hidden rounded-2xl bg-cream-50 shadow-sm border border-espresso-100 hover:shadow-lg hover:border-espresso-200 transition-all"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="relative h-44 overflow-hidden bg-espresso-100">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <button
                      onClick={() => addToCart(item)}
                      className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-espresso-700 text-cream-50 shadow-lg hover:bg-espresso-800 hover:scale-110 active:scale-95 transition-all"
                      aria-label={`Add ${item.name} to cart`}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-espresso-800">{item.name}</h3>
                      <span className="font-semibold text-espresso-700 whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm text-espresso-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {filteredSoldOut.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-espresso-400 mb-3">
                  Currently unavailable
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSoldOut.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl bg-cream-50/60 border border-espresso-100 opacity-60"
                    >
                      <div className="relative h-44 overflow-hidden bg-espresso-100">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover grayscale" />
                        )}
                        <div className="absolute inset-0 bg-espresso-900/30 flex items-center justify-center">
                          <span className="rounded-full bg-espresso-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream-50">
                            Sold out
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg font-semibold text-espresso-600">{item.name}</h3>
                          <span className="font-semibold text-espresso-400">{formatCurrency(item.price)}</span>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-espresso-400 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {!loading && filteredItems.length === 0 && filteredSoldOut.length === 0 && (
              <div className="text-center py-20 text-espresso-400">
                <Coffee className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No items in this category yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-espresso-900/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-cream-50 shadow-2xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between border-b border-espresso-200 px-5 py-4">
              <h2 className="font-display text-xl font-bold text-espresso-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Current Order
              </h2>
              <button onClick={() => setCartOpen(false)} className="rounded-lg p-1.5 text-espresso-400 hover:bg-espresso-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-espresso-400 px-6 text-center">
                <ShoppingBag className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">Cart is empty</p>
                <p className="text-sm mt-1">Add items from the menu to get started.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
                  {cart.map((c) => (
                    <div key={c.menuItem.id} className="flex items-center gap-3 rounded-xl bg-cream-100 p-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-espresso-100">
                        {c.menuItem.image_url && (
                          <img src={c.menuItem.image_url} alt={c.menuItem.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-espresso-800 truncate">{c.menuItem.name}</h4>
                        <p className="text-sm text-espresso-500">{formatCurrency(c.menuItem.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(c.menuItem.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-50 border border-espresso-200 text-espresso-600 hover:bg-espresso-100 transition"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-espresso-800">{c.quantity}</span>
                        <button
                          onClick={() => updateQty(c.menuItem.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-espresso-700 text-cream-50 hover:bg-espresso-800 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-espresso-200 px-5 py-4 space-y-3 bg-cream-100/50">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Table no. (optional)"
                      className="rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 placeholder:text-espresso-300 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                    />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name (optional)"
                      className="rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 placeholder:text-espresso-300 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-espresso-500">Total</span>
                    <span className="font-display text-2xl font-bold text-espresso-800">{formatCurrency(cartTotal)}</span>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="w-full rounded-xl bg-espresso-700 py-3 font-semibold text-cream-50 hover:bg-espresso-800 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" /> Placing order…
                      </>
                    ) : (
                      <>Place Order &mdash; {formatCurrency(cartTotal)}</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-espresso-900/60 backdrop-blur-sm" onClick={() => setOrderSuccess(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-cream-50 p-8 text-center shadow-2xl animate-scale-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-500/15">
              <CheckCircle2 className="h-9 w-9 text-sage-600" />
            </div>
            <h3 className="font-display text-2xl font-bold text-espresso-800">Order placed!</h3>
            <p className="mt-2 text-espresso-500 text-sm">
              Total: <span className="font-semibold text-espresso-700">{formatCurrency(orderSuccess.total)}</span>. Inventory has been updated automatically.
            </p>
            <button
              onClick={() => setOrderSuccess(null)}
              className="mt-6 w-full rounded-xl bg-espresso-700 py-2.5 font-medium text-cream-50 hover:bg-espresso-800 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Mobile: switch to admin + sign out */}
      <div className="sm:hidden fixed bottom-5 left-5 z-30 flex flex-col gap-2">
        {onSwitchToAdmin && (
          <button
            onClick={onSwitchToAdmin}
            className="flex items-center gap-1.5 rounded-full bg-espresso-700 px-4 py-2.5 text-sm font-medium text-cream-50 shadow-lg"
          >
            Admin Panel
          </button>
        )}
      </div>
    </div>
  );
}
