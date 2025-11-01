import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// TypeScript interfaces
export interface Product {
  id: string;
  name: string;
  product_id: string;
  category: string;
  subCategory?: string;
  price: number;
  stock: number;
  sold_count: number; // Track how many items have been sold
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  staff_name?: string;
  payment_mode: string;
  payment_status: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// User Roles
export type UserRole = 'manager' | 'staff';

export interface User {
  email: string;
  role: UserRole;
  name?: string;
}

