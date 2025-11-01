# User Case Documentation - FUDE Studio Dubai Inventory System

## Overview
This document outlines the use cases for each user role in the FUDE Studio Dubai POS Inventory Management System.

---

## 👨‍💼 Manager Role

### Access Level
**Full System Access** - All features and pages available

### Available Pages
- ✅ Menu (Products)
- ✅ Orders
- ✅ Dashboard
- ✅ Reports
- ✅ Settings

---

### Use Case 1: System Login
**Actor:** Manager  
**Goal:** Authenticate and access the full system

**Preconditions:**
- Manager has valid credentials stored in `.env` file

**Steps:**
1. Open the application
2. Enter manager email (configured in `VITE_MANAGER_EMAIL`)
3. Enter manager password (configured in `VITE_MANAGER_PASSWORD`)
4. Click "Sign In"
5. System validates credentials
6. Redirected to Menu page with full access

**Postconditions:**
- Manager is logged in
- Full navigation menu visible (Menu, Orders, Dashboard, Reports, Settings)
- Manager badge displayed in header

---

### Use Case 2: Product Management (Add New Product)
**Actor:** Manager  
**Goal:** Add new menu items to the inventory

**Preconditions:**
- Manager is logged in
- Manager is on Menu (Products) page

**Steps:**
1. Navigate to Menu page
2. Click "Add Product" button
3. Fill in product details:
   - Product Name (e.g., "Cappuccino")
   - Product ID (e.g., "CAF-001")
   - Category (e.g., "Beverages")
   - Subcategory (e.g., "Coffee")
   - Price (e.g., "15.00")
   - Upload product image (optional)
4. Click "Save Product"
5. System creates product in Firestore
6. Product appears in menu grid

**Postconditions:**
- New product visible in inventory
- Product available for ordering
- Product searchable and filterable

**Alternative Flow:**
- If required fields missing → Show validation errors
- If image upload fails → Product saved without image

---

### Use Case 3: Product Management (Edit Product)
**Actor:** Manager  
**Goal:** Update existing product information or pricing

**Preconditions:**
- Manager is logged in
- Manager is on Dashboard page
- Products exist in system

**Steps:**
1. Navigate to Dashboard
2. Use search or filters to find product
3. Click Edit icon on product row
4. Modify desired fields (name, price, category, etc.)
5. Upload new image if needed
6. Click "Update Product"
7. System updates product in Firestore

**Postconditions:**
- Product information updated
- Changes reflected immediately
- Menu displays updated information

---

### Use Case 4: Product Management (Delete Product)
**Actor:** Manager  
**Goal:** Remove discontinued items from inventory

**Preconditions:**
- Manager is logged in
- Manager is on Dashboard page
- Product exists in system

**Steps:**
1. Navigate to Dashboard
2. Find product to delete
3. Click Delete icon (trash) on product row
4. Confirm deletion in dialog
5. System removes product from Firestore

**Postconditions:**
- Product removed from system
- Product no longer appears in menu
- Product unavailable for new orders

---

### Use Case 5: Take Customer Order
**Actor:** Manager  
**Goal:** Process customer order and generate invoice

**Preconditions:**
- Manager is logged in
- Products exist in system
- Manager is on Menu page

**Steps:**
1. Navigate to Menu page
2. Browse categories (All, Bar, Food, etc.)
3. Select subcategory if needed
4. Click "ADD" on desired products
5. Products added to cart (right sidebar on desktop, drawer on mobile)
6. Adjust quantities using +/- buttons
7. Remove unwanted items with trash icon
8. Select payment method (Cash or Card)
9. Review order total (subtotal + tax)
10. Click "Place Order"
11. System creates order in Firestore
12. System updates product sold_count
13. Invoice dialog opens automatically
14. Print invoice or close

**Postconditions:**
- Order saved with manager's name
- Cart cleared
- Invoice ready for printing
- Product statistics updated

---

### Use Case 6: View and Manage Orders
**Actor:** Manager  
**Goal:** Monitor all orders and update payment status

**Preconditions:**
- Manager is logged in
- Orders exist in system

**Steps:**
1. Navigate to Orders page
2. View complete order history
3. Filter by:
   - Search (order ID or product name)
   - Payment Status (All/Paid/Pending/Cancelled)
   - Payment Mode (All/Cash/Card)
4. View order details:
   - Date and time
   - Items ordered
   - Staff member who took order
   - Payment method
   - Total amount
5. Update payment status via dropdown
6. Click Eye icon to view invoice
7. Click Print icon to print receipt

**Postconditions:**
- Order status updated in Firestore
- Changes visible to all users
- Order history maintained

---

### Use Case 7: View Dashboard Analytics
**Actor:** Manager  
**Goal:** Monitor inventory and sales performance

**Preconditions:**
- Manager is logged in
- Products exist in system

**Steps:**
1. Navigate to Dashboard page
2. View statistics:
   - Total Products count
   - Total Categories count
3. Use search to find specific products
4. Filter by category
5. View product details in table:
   - Product image
   - Name and ID
   - Category
   - Current price
   - Items sold
6. Edit or delete products as needed

**Postconditions:**
- Manager has overview of inventory
- Quick access to product management

---

### Use Case 8: Generate Sales Reports
**Actor:** Manager  
**Goal:** Analyze sales performance and trends

**Preconditions:**
- Manager is logged in
- Orders exist in system

**Steps:**
1. Navigate to Reports page
2. View real-time metrics:
   - Total Revenue
   - Items Sold
   - Total Orders
   - Total Products
3. Set date range filter (optional):
   - Click "From Date" calendar
   - Select start date
   - Click "To Date" calendar
   - Select end date
4. View filtered results
5. Analyze sales by category (pie chart)
6. Review top-selling products list
7. Click "Export CSV" to download report

**Postconditions:**
- Manager has insights into business performance
- Data available for business decisions
- Reports can be shared with stakeholders

---

### Use Case 9: Configure System Settings
**Actor:** Manager  
**Goal:** Customize store and invoice configuration

**Preconditions:**
- Manager is logged in

**Steps:**
1. Navigate to Settings page
2. Update Invoice Information:
   - Brand Name (appears on receipts)
   - Company Name
   - Company Address
   - Phone Number
   - Email
   - Tax Rate (percentage)
3. Update Store Settings:
   - Store Name (appears in sidebar)
   - Currency (AED, USD, etc.)
4. Click "Save Settings"
5. System updates settings in Firestore

**Postconditions:**
- Settings saved and applied immediately
- Invoices reflect new information
- System uses updated currency and tax rate

---

### Use Case 10: Logout
**Actor:** Manager  
**Goal:** Securely exit the system

**Steps:**
1. Click user profile in header
2. Click "Log Out" in dropdown
3. System clears session
4. Redirected to login page

**Postconditions:**
- User logged out
- Session cleared from localStorage
- System requires login for next access

---

## 👥 Staff Role

### Access Level
**Limited Access** - Only essential operational features

### Available Pages
- ✅ Menu (Products) - For taking orders
- ✅ Orders - View and manage orders
- ✅ Settings - View store information (Read-only)

### Restricted Pages
- ❌ Dashboard - Cannot access
- ❌ Reports - Cannot access

---

### Use Case 11: Staff Login with Name Entry
**Actor:** Staff Member  
**Goal:** Login and identify themselves for order tracking

**Preconditions:**
- Staff credentials stored in `.env` file

**Steps:**
1. Open the application
2. Enter staff email (from `VITE_STAFF_EMAILS` list)
3. Enter staff password (corresponding password from `VITE_STAFF_PASSWORDS`)
4. Click "Sign In"
5. System validates credentials
6. **Name Dialog Appears** (Staff-specific feature)
7. Enter personal name (e.g., "Ahmed", "Sara")
8. Click "Continue" or press Enter
9. System saves name with session
10. Redirected to Menu page

**Postconditions:**
- Staff logged in with name recorded
- Name will be attached to all orders
- Limited navigation menu visible
- Staff badge displayed in header

**Alternative Flow:**
- If name field empty → Show error message
- Name required to proceed

---

### Use Case 12: Take Customer Order (Staff)
**Actor:** Staff Member  
**Goal:** Process customer order during shift

**Preconditions:**
- Staff is logged in with name entered
- Products exist in system
- Staff is on Menu page

**Steps:**
1. Navigate to Menu page
2. Browse categories and subcategories
3. Add items to cart by clicking "ADD"
4. **On Mobile/Tablet:**
   - Click floating cart button (bottom-right)
   - Cart drawer slides in
5. **On Desktop:**
   - Cart visible on right sidebar
6. Adjust quantities as needed
7. Select payment method (Cash/Card)
8. Review order total
9. Click "Place Order"
10. System saves order with **staff member's name**
11. Invoice dialog opens
12. Show/Print invoice to customer

**Postconditions:**
- Order recorded with staff attribution
- Manager can see who took the order
- Staff accountability maintained
- Cart cleared for next order

**Key Difference from Manager:**
- Staff name automatically attached to order
- Visible in Orders table "Staff" column

---

### Use Case 13: View Order History (Staff)
**Actor:** Staff Member  
**Goal:** Check order status and reprint receipts

**Preconditions:**
- Staff is logged in
- Staff is on Orders page

**Steps:**
1. Navigate to Orders page
2. View all orders (including own orders)
3. See which staff member took each order
4. Search for specific orders
5. Filter by status or payment mode
6. View order details
7. Update payment status if customer pays
8. Reprint invoices as needed

**Postconditions:**
- Staff can track orders
- Customer service improved
- Order information accessible

**Limitations:**
- Cannot delete orders
- Can view all orders (not just own)

---

### Use Case 14: View Settings (Staff)
**Actor:** Staff Member  
**Goal:** Reference store information for customer inquiries

**Preconditions:**
- Staff is logged in

**Steps:**
1. Navigate to Settings page
2. View store information:
   - Store name and address
   - Contact phone and email
   - Tax rate
   - Currency
3. Reference information when needed

**Postconditions:**
- Staff informed about store details
- Can answer customer questions

**Limitations:**
- **Read-only access** (fields disabled)
- Cannot modify settings
- Cannot save changes

---

### Use Case 15: Attempt to Access Restricted Pages (Staff)
**Actor:** Staff Member  
**Goal:** Try to access Dashboard or Reports

**Preconditions:**
- Staff is logged in

**Steps:**
1. Staff notices Dashboard/Reports not in menu
2. Staff tries to manually navigate via URL
3. System detects staff role
4. **Auto-redirects to Menu page**
5. Access denied message (implicit)

**Postconditions:**
- Staff remains on allowed pages
- Security maintained
- Role-based access enforced

**Security Feature:**
- Backend validation prevents unauthorized access
- Frontend hides restricted menu items
- URL-based access attempts blocked

---

### Use Case 16: Mobile/Tablet Cart Access (Staff)
**Actor:** Staff Member  
**Goal:** Access cart on mobile device while taking orders

**Preconditions:**
- Staff is logged in on tablet/mobile device
- Using device with screen < 1024px

**Steps:**
1. On Menu page taking order
2. Add items to cart
3. **Floating Cart Button appears** (bottom-right)
4. Button shows item count badge
5. Click floating cart button
6. Cart drawer slides in from right
7. Manage order in drawer
8. Close drawer to continue browsing
9. Click floating button again to reopen

**Postconditions:**
- Efficient mobile workflow
- Cart accessible without header clutter
- Easy one-handed operation

**Desktop Behavior:**
- Cart always visible on right sidebar
- No floating button needed

---

### Use Case 17: Staff Logout
**Actor:** Staff Member  
**Goal:** End shift and logout

**Steps:**
1. Click user profile in header
2. Click "Log Out"
3. System clears session and name
4. Redirected to login page

**Postconditions:**
- Staff logged out
- Next staff must enter own name
- Order attribution reset

---

## 🔄 Cross-Role Use Cases

### Use Case 18: Invoice Printing (Both Roles)
**Actor:** Manager or Staff  
**Goal:** Print thermal receipt for customer

**Preconditions:**
- Order has been placed
- Invoice dialog is open

**Steps:**
1. Order completed
2. Invoice dialog opens automatically
3. View invoice details:
   - Brand name (JAMES / JAMES CAFE LTD)
   - Store address and contact
   - Order date and time
   - Itemized list with quantities
   - Subtotal, tax, total
   - Payment method
   - Thank you message
4. Click "Print Invoice" button
5. Browser print dialog opens
6. **Format:** 80mm thermal receipt
7. Print or save as PDF
8. Close dialog when done

**Postconditions:**
- Customer receives receipt
- Order documented
- Professional presentation

**Technical Details:**
- Custom CSS for 80mm thermal format
- Matches James Cafe design
- Print-optimized styling

---

### Use Case 19: Responsive Navigation (Both Roles)
**Actor:** Manager or Staff  
**Goal:** Navigate system on different devices

**Desktop (≥ 1024px):**
- Fixed sidebar always visible
- All navigation items shown (based on role)
- Fixed cart sidebar on Products page
- Spacious layout

**Tablet (640px - 1023px):**
- Sidebar hidden by default
- Hamburger menu in header
- Click hamburger to open sidebar
- Sidebar slides in with overlay
- Cart drawer instead of fixed sidebar
- Floating cart button on Products page

**Mobile (< 640px):**
- Same as tablet
- Condensed layouts
- Smaller text and buttons
- Horizontal scrolling tables
- Stacked filters and controls
- Touch-optimized buttons

**Postconditions:**
- Consistent experience across devices
- Optimized for each screen size
- Touch-friendly on mobile/tablet

---

## 🎯 Key Differences Between Roles

| Feature | Manager | Staff |
|---------|---------|-------|
| **Dashboard Access** | ✅ Full Access | ❌ No Access |
| **Reports Access** | ✅ Full Access | ❌ No Access |
| **Product Management** | ✅ Add/Edit/Delete | ❌ View Only |
| **Settings** | ✅ Full Edit | 👁️ Read Only |
| **Order Taking** | ✅ Yes | ✅ Yes |
| **Order Management** | ✅ Yes | ✅ Yes |
| **Name Entry at Login** | ❌ Not Required | ✅ Required |
| **Order Attribution** | Name from .env | Name from dialog |
| **Navigation Items** | 5 pages | 3 pages |

---

## 🔐 Security & Authentication

### Password Storage
- All credentials stored in `.env` file
- Never committed to repository
- Secure environment variable access

### Session Management
- localStorage for session persistence
- Role validation on every page load
- Automatic redirect for unauthorized access

### Staff Identification
- Name captured at login
- Stored in session
- Attached to every order
- Accountability and tracking

---

## 📱 Device-Specific Workflows

### Desktop Workflow (Manager/Staff)
1. Login with credentials
2. Fixed sidebar navigation
3. Fixed cart on right (Products page)
4. Side-by-side layout
5. Keyboard shortcuts available
6. Mouse/trackpad interaction

### Tablet Workflow (Manager/Staff)
1. Login with credentials
2. Tap hamburger menu to navigate
3. Tap floating cart button (Products page)
4. Cart drawer slides in
5. Touch gestures
6. One-handed operation possible

### Mobile Workflow (Staff - Taking Order)
1. Login with credentials
2. Enter name in dialog
3. Tap hamburger for navigation
4. Navigate to Menu
5. Scroll categories horizontally
6. Tap ADD to add items
7. Tap floating cart button (bottom-right)
8. Cart drawer opens
9. Adjust quantities
10. Select Cash/Card payment
11. Place order
12. Show invoice to customer
13. Close cart drawer
14. Ready for next order

---

## 🎨 Branding

### System Branding
- **Powered by:** FUDE Studio Dubai
- **Copyright:** © 2025 FUDE Studio Dubai
- **Login:** FUDE Studio Dubai Inventory Management System

### Store Branding (Configurable)
- **Store Name:** Set in Settings (appears in sidebar)
- **Invoice Brand:** Set in Settings (appears on receipts)
- **Company Name:** Set in Settings (legal name on receipts)

---

## 📊 Data Flow

### Order Creation Flow
1. User adds items to cart
2. User selects payment method
3. User clicks "Place Order"
4. System creates order document in Firestore
5. System creates order_items documents
6. System updates product sold_count
7. System attaches staff/manager name
8. Invoice generated
9. Cart cleared
10. User ready for next order

### Staff Attribution Flow
1. Staff logs in with email/password
2. System validates credentials
3. Name dialog appears (staff only)
4. Staff enters personal name
5. Name saved in localStorage with session
6. Name retrieved when placing order
7. Name attached to order document
8. Name visible in Orders table
9. Manager can track performance

---

## 🚀 Best Practices

### For Managers
- Regularly review Reports for insights
- Update product prices in Dashboard
- Monitor staff performance via order attribution
- Configure Settings for accurate invoices
- Back up data regularly
- Train staff on system usage

### For Staff
- Always enter correct name at login
- Verify order details before placing
- Select correct payment method
- Double-check quantities
- Print receipt for customer
- Update payment status when customer pays
- Ask manager for help with issues

---

## 📞 Support

For technical issues or questions:
- Contact: FUDE Studio Dubai
- System issues: Check AUTH_README.md
- Configuration: Check .env.example

---

**Document Version:** 1.0  
**Last Updated:** November 1, 2025  
**System:** FUDE Studio Dubai POS Inventory Management  
**Powered by:** FUDE Studio Dubai
