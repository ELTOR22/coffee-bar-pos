export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  created_at: string;
}

export interface RecipeItem {
  menu_item_id: string;
  ingredient_id: string;
  quantity_used: number;
}

export interface Order {
  id: string;
  table_number: string | null;
  customer_name: string | null;
  status: string;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  created_at: string;
}

export interface StockLog {
  id: string;
  ingredient_id: string;
  change_amount: number;
  reason: string;
  note: string | null;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface MenuItemWithCategory extends MenuItem {
  category?: Category;
}

export interface OrderWithItems extends Order {
  order_items?: (OrderItem & { menu_items?: MenuItem })[];
}

export interface StockLogWithIngredient extends StockLog {
  ingredients?: Ingredient;
}

export type UserRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
}
