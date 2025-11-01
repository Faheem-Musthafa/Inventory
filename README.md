# Inventory Management System

A modern, full-featured inventory management system built with React, TypeScript, and Firebase.

## Features

- 📦 **Product Management** - Add, edit, delete products with product_id tracking
- 🛒 **Order Management** - Create orders with automatic stock deduction
- 📊 **Reports & Analytics** - Sales reports, top products, and category insights
- 🧾 **Invoice Generation** - Print-ready invoices for orders
- 🎨 **Modern UI** - Clean, responsive interface with Tailwind CSS
- 🔥 **Firebase Backend** - Real-time database with Firestore

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Database:** Firebase Firestore
- **UI Library:** Tailwind CSS, shadcn/ui (Radix UI)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Firebase account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Follow the detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Create a Firebase project
   - Enable Firestore Database
   - Copy `.env.example` to `.env` and add your Firebase credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── ProductDialog.tsx
│   ├── CreateOrderDialog.tsx
│   └── InvoiceDialog.tsx
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview & statistics
│   ├── Products.tsx    # Product inventory
│   ├── Orders.tsx      # Order management
│   ├── Reports.tsx     # Analytics & reports
│   └── Settings.tsx    # App settings
├── lib/                # Utilities & configuration
│   ├── firebase.ts     # Firebase setup
│   └── utils.ts        # Helper functions
├── hooks/              # Custom React hooks
└── App.tsx            # Main app component
```

## Database Schema

### Collections

#### `products`
- Product inventory with product_id, category, price, and stock tracking

#### `orders`
- Customer orders with payment information and totals

#### `order_items`
- Individual items within each order (one-to-many relationship)

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed schema information.

## Features Overview

### Dashboard
- Total products, orders, stock value, and daily sales
- 7-day sales chart
- Quick actions for adding products/orders

### Products
- Search and filter by category
- Low stock indicators
- CRUD operations with form validation

### Orders
- Create orders with product selection
- Automatic stock deduction
- View and print invoices

### Reports
- Total sales and average order value
- Stock value by category (pie chart)
- Top 5 selling products
- Export to CSV

### Settings
- Store information management
- Tax and currency configuration
- Notification preferences

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Environment Variables

Required environment variables (see `.env.example`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Security Notes

⚠️ **Important:** The current Firestore rules allow public access for demonstration purposes.

For production deployment:
1. Enable Firebase Authentication
2. Update Firestore security rules
3. Implement role-based access control
4. Add user authentication to the app

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.
