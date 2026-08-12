import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Link2, Coffee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCategories, useIngredients, useMenuItems, useRecipes } from '../../hooks/useData';
import { useToast } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import { formatCurrency } from '../../lib/format';
import type { Ingredient, MenuItemWithCategory } from '../../types';

interface EditState {
  id: string | null;
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
  sort_order: string;
  recipe: { ingredient_id: string; quantity_used: string }[];
}

const EMPTY: EditState = {
  id: null,
  name: '',
  description: '',
  price: '',
  category_id: '',
  image_url: '',
  is_available: true,
  sort_order: '0',
  recipe: [],
};

export function MenuPanel() {
  const { categories } = useCategories();
  const { items, loading, refetch } = useMenuItems();
  const { ingredients } = useIngredients();
  const { recipes, refetch: refetchRecipes } = useRecipes();
  const { notify } = useToast();

  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MenuItemWithCategory | null>(null);
  const [filterCat, setFilterCat] = useState('all');

  const recipeMap = useMemo(() => {
    const map = new Map<string, { ingredient_id: string; quantity_used: number }[]>();
    for (const r of recipes) {
      const arr = map.get(r.menu_item_id) ?? [];
      arr.push({ ingredient_id: r.ingredient_id, quantity_used: r.quantity_used });
      map.set(r.menu_item_id, arr);
    }
    return map;
  }, [recipes]);

  const filtered = useMemo(() => {
    if (filterCat === 'all') return items;
    return items.filter((i) => i.category_id === filterCat);
  }, [items, filterCat]);

  function openNew() {
    setEdit({ ...EMPTY, category_id: categories[0]?.id ?? '' });
  }

  function openEdit(item: MenuItemWithCategory) {
    const itemRecipes = recipeMap.get(item.id) ?? [];
    setEdit({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category_id: item.category_id,
      image_url: item.image_url ?? '',
      is_available: item.is_available,
      sort_order: String(item.sort_order),
      recipe: itemRecipes.map((r) => ({ ingredient_id: r.ingredient_id, quantity_used: String(r.quantity_used) })),
    });
  }

  function addRecipeRow() {
    setEdit((e) => e ? { ...e, recipe: [...e.recipe, { ingredient_id: '', quantity_used: '' }] } : e);
  }

  function updateRecipeRow(idx: number, field: 'ingredient_id' | 'quantity_used', value: string) {
    setEdit((e) => {
      if (!e) return e;
      const recipe = e.recipe.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
      return { ...e, recipe };
    });
  }

  function removeRecipeRow(idx: number) {
    setEdit((e) => {
      if (!e) return e;
      return { ...e, recipe: e.recipe.filter((_, i) => i !== idx) };
    });
  }

  async function handleSave() {
    if (!edit) return;
    if (!edit.name.trim()) { notify('Item name is required', 'error'); return; }
    if (!edit.category_id) { notify('Category is required', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        name: edit.name.trim(),
        description: edit.description.trim() || null,
        price: parseFloat(edit.price) || 0,
        category_id: edit.category_id,
        image_url: edit.image_url.trim() || null,
        is_available: edit.is_available,
        sort_order: parseInt(edit.sort_order) || 0,
      };

      let itemId = edit.id;
      if (edit.id) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', edit.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('menu_items').insert(payload).select('id').single();
        if (error) throw error;
        itemId = data.id;
      }

      // Save recipe: delete existing, insert new
      await supabase.from('menu_item_ingredients').delete().eq('menu_item_id', itemId);
      const validRecipes = edit.recipe.filter((r) => r.ingredient_id && parseFloat(r.quantity_used) > 0);
      if (validRecipes.length > 0) {
        const { error: recipeError } = await supabase.from('menu_item_ingredients').insert(
          validRecipes.map((r) => ({
            menu_item_id: itemId,
            ingredient_id: r.ingredient_id,
            quantity_used: parseFloat(r.quantity_used),
          }))
        );
        if (recipeError) throw recipeError;
      }

      notify(edit.id ? 'Menu item updated' : 'Menu item added');
      await Promise.all([refetch(), refetchRecipes()]);
      setEdit(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      notify(`${confirmDelete.name} deleted`);
      await refetch();
      setConfirmDelete(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(item: MenuItemWithCategory) {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    if (error) { notify(error.message, 'error'); return; }
    await refetch();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-espresso-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setFilterCat('all')}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filterCat === 'all' ? 'bg-espresso-700 text-cream-50' : 'text-espresso-500 hover:bg-espresso-100'
            }`}
          >
            All ({items.length})
          </button>
          {categories.map((c) => {
            const count = items.filter((i) => i.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  filterCat === c.id ? 'bg-espresso-700 text-cream-50' : 'text-espresso-500 hover:bg-espresso-100'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-espresso-700 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-espresso-800 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const itemRecipe = recipeMap.get(item.id) ?? [];
          return (
            <div
              key={item.id}
              className={`group overflow-hidden rounded-2xl bg-cream-50 border border-espresso-100 shadow-sm transition hover:shadow-md ${
                !item.is_available ? 'opacity-70' : ''
              }`}
            >
              <div className="relative h-32 overflow-hidden bg-espresso-100">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-espresso-900/40 flex items-center justify-center">
                    <span className="rounded-full bg-espresso-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream-50">
                      Unavailable
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-50/90 text-espresso-600 hover:bg-cream-50 shadow-sm transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-50/90 text-rust-600 hover:bg-cream-50 shadow-sm transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-espresso-800 text-sm">{item.name}</h3>
                  <span className="font-semibold text-espresso-700">{formatCurrency(item.price)}</span>
                </div>
                <p className="text-xs text-espresso-400 mt-0.5">{item.category?.name}</p>
                {item.description && (
                  <p className="text-sm text-espresso-500 mt-1.5 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-espresso-400">
                    <Link2 className="h-3.5 w-3.5" />
                    {itemRecipe.length} ingredient{itemRecipe.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => toggleAvailable(item)}
                    className={`relative h-5 w-9 rounded-full transition ${item.is_available ? 'bg-sage-500' : 'bg-espresso-200'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream-50 transition-transform ${
                        item.is_available ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-espresso-400">
          <Coffee className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No menu items yet. Click "Add item" to create one.</p>
        </div>
      )}

      {/* Edit / create modal */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit menu item' : 'New menu item'}
        size="lg"
      >
        {edit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Description</label>
                <textarea
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Price (₱)</label>
                <input
                  type="number"
                  step="0.25"
                  value={edit.price}
                  onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                  className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Category</label>
                <select
                  value={edit.category_id}
                  onChange={(e) => setEdit({ ...edit, category_id: e.target.value })}
                  className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-espresso-700 mb-1.5">Image URL</label>
                <input
                  type="url"
                  value={edit.image_url}
                  onChange={(e) => setEdit({ ...edit, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-espresso-200 bg-cream-50 px-3 py-2 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                />
              </div>
            </div>

            {/* Recipe builder */}
            <div className="rounded-xl border border-espresso-200 p-4 bg-cream-100/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-espresso-800 text-sm flex items-center gap-1.5">
                    <Link2 className="h-4 w-4" /> Recipe (ingredients consumed per serving)
                  </h3>
                  <p className="text-xs text-espresso-400 mt-0.5">Stock auto-deducts when this item is ordered.</p>
                </div>
                <button
                  onClick={addRecipeRow}
                  className="flex items-center gap-1 rounded-lg border border-espresso-200 px-2.5 py-1.5 text-xs font-medium text-espresso-600 hover:bg-cream-50 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>

              {edit.recipe.length === 0 ? (
                <p className="text-sm text-espresso-400 py-2">No ingredients linked. This item won't affect inventory.</p>
              ) : (
                <div className="space-y-2">
                  {edit.recipe.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.ingredient_id}
                        onChange={(e) => updateRecipeRow(idx, 'ingredient_id', e.target.value)}
                        className="flex-1 rounded-lg border border-espresso-200 bg-cream-50 px-2.5 py-1.5 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                      >
                        <option value="">Select ingredient…</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.5"
                        value={row.quantity_used}
                        onChange={(e) => updateRecipeRow(idx, 'quantity_used', e.target.value)}
                        placeholder="Qty"
                        className="w-20 rounded-lg border border-espresso-200 bg-cream-50 px-2.5 py-1.5 text-sm text-espresso-800 focus:outline-none focus:ring-2 focus:ring-espresso-400"
                      />
                      <button
                        onClick={() => removeRecipeRow(idx)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso-400 hover:bg-rust-500/10 hover:text-rust-600 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-espresso-700">
              <input
                type="checkbox"
                checked={edit.is_available}
                onChange={(e) => setEdit({ ...edit, is_available: e.target.checked })}
                className="h-4 w-4 rounded border-espresso-300 text-espresso-700 focus:ring-espresso-400"
              />
              Available on menu
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-espresso-700 py-2.5 font-semibold text-cream-50 hover:bg-espresso-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : edit.id ? 'Save changes' : 'Create item'}
            </button>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete item?"
        size="sm"
      >
        <p className="text-sm text-espresso-600">
          Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This will also remove its recipe. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 rounded-lg border border-espresso-200 py-2.5 text-sm font-medium text-espresso-600 hover:bg-espresso-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex-1 rounded-lg bg-rust-600 py-2.5 text-sm font-medium text-cream-50 hover:bg-rust-500 transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
