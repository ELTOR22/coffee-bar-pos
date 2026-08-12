import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Category,
  Ingredient,
  MenuItemWithCategory,
  OrderWithItems,
  RecipeItem,
  StockLogWithIngredient,
} from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (error) setError(error.message);
    else setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { categories, loading, error, refetch: fetch };
}

export function useMenuItems() {
  const [items, setItems] = useState<MenuItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, category:categories(*)')
      .order('sort_order');
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { items, loading, error, refetch: fetch };
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');
    if (error) setError(error.message);
    else setIngredients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ingredients, loading, error, refetch: fetch };
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('menu_item_ingredients')
      .select('*');
    setRecipes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { recipes, loading, refetch: fetch };
}

export function useOrders(limit = 50) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) setError(error.message);
    else setOrders(data ?? []);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { orders, loading, error, refetch: fetch };
}

export function useStockLogs(limit = 100) {
  const [logs, setLogs] = useState<StockLogWithIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('stock_logs')
      .select('*, ingredients(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
    setLogs(data ?? []);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { logs, loading, refetch: fetch };
}

export async function placeOrder(
  tableNumber: string,
  customerName: string,
  items: { menu_item_id: string; quantity: number }[]
): Promise<{ order_id: string; total: number }> {
  const { data, error } = await supabase.rpc('place_order', {
    p_table_number: tableNumber || null,
    p_customer_name: customerName || null,
    p_items: items,
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from place_order');
  return data as { order_id: string; total: number };
}

export async function adjustStock(
  ingredientId: string,
  changeAmount: number,
  reason: string,
  note: string
): Promise<void> {
  const { error } = await supabase.rpc('adjust_stock', {
    p_ingredient_id: ingredientId,
    p_change_amount: changeAmount,
    p_reason: reason,
    p_note: note,
  });
  if (error) throw error;
}


