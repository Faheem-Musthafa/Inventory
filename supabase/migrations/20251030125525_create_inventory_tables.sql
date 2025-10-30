/*
  # Inventory Management System Database Schema

  ## Overview
  Creates the complete database structure for an inventory management system
  with products, orders, and order items tracking.

  ## Tables Created
  
  ### 1. products
  - `id` (uuid, primary key) - Unique product identifier
  - `name` (text) - Product name
  - `sku` (text, unique) - Stock Keeping Unit
  - `category` (text) - Product category
  - `price` (decimal) - Product price
  - `stock` (integer) - Available stock quantity
  - `image_url` (text, optional) - Product image URL
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. orders
  - `id` (uuid, primary key) - Unique order identifier
  - `customer_name` (text) - Customer name
  - `payment_mode` (text) - Payment method (Cash, UPI, Card)
  - `payment_status` (text) - Payment status
  - `subtotal` (decimal) - Order subtotal
  - `tax` (decimal) - Tax amount
  - `total` (decimal) - Total order amount
  - `created_at` (timestamptz) - Order creation timestamp

  ### 3. order_items
  - `id` (uuid, primary key) - Unique order item identifier
  - `order_id` (uuid, foreign key) - Reference to orders table
  - `product_id` (uuid, foreign key) - Reference to products table
  - `product_name` (text) - Product name snapshot
  - `quantity` (integer) - Quantity ordered
  - `price` (decimal) - Price at time of order
  - `total` (decimal) - Line item total

  ## Security
  - RLS enabled on all tables
  - Public access policies for demonstration (restrict in production)

  ## Notes
  - All monetary values use decimal type for precision
  - Timestamps use timestamptz for timezone awareness
  - Product name snapshot in order_items preserves historical data
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  payment_mode text NOT NULL DEFAULT 'Cash',
  payment_status text NOT NULL DEFAULT 'Paid',
  subtotal decimal(10, 2) NOT NULL DEFAULT 0,
  tax decimal(10, 2) NOT NULL DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to products"
  ON products FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to products"
  ON products FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from products"
  ON products FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to orders"
  ON orders FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from orders"
  ON orders FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to order_items"
  ON order_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to order_items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to order_items"
  ON order_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from order_items"
  ON order_items FOR DELETE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);