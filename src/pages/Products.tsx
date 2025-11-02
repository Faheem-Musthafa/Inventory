import { useEffect, useState } from 'react';
import { Plus, Wine, UtensilsCrossed, Pizza, Soup, Fish, Package, ShoppingCart, Minus, Trash2, CreditCard, Banknote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db, type Product } from '@/lib/firebase';
import { collection, getDocs, doc as firestoreDoc, orderBy, query, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ProductDialog } from '@/components/ProductDialog';
import { InvoiceDialog } from '@/components/InvoiceDialog';
import { useToast } from '@/hooks/use-toast';
import type { OrderWithItems } from '@/lib/firebase';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { addSaleToStorage, type StaffSale } from '@/lib/salesTracking';

interface CartItem {
  product: Product;
  quantity: number;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('AED');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxRate, setTaxRate] = useState(0.1);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderWithItems | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = firestoreDoc(db, 'settings', 'store');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const settings = docSnap.data();
        setCurrencySymbol(settings.currency || 'AED');
        setTaxRate((settings.taxRate || 10) / 100);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toFixed(2)}`;
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, categoryFilter, subCategoryFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (error: any) {
      toast({
        title: 'Error loading products',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (subCategoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.subCategory === subCategoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setSubCategoryFilter('all'); // Reset subcategory when category changes
  };



  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSaveSuccess = () => {
    loadProducts();
    handleDialogClose();
  };

  // Cart Functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    
    toast({
      title: 'Added to order',
      description: `${product.name} added to your order`,
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartTax = cartSubtotal * taxRate;
  const cartTotal = cartSubtotal + cartTax;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your order',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingOrder(true);
    try {
      // Get current user for staff name
      const currentUser = getCurrentUser();
      const staffName = currentUser?.name || 'Unknown';

      // Create order
      const orderData = {
        payment_mode: paymentMethod, // Use selected payment method (Cash or Card)
        payment_status: 'Paid', // Set as Paid when order is created
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        created_at: new Date().toISOString(),
        customer_name: 'Walk-in Customer', // Default customer name
        staff_name: staffName, // Add staff name who took the order
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Add order items and update stock
      const orderItems = [];
      for (const item of cart) {
        const orderItemData = {
          order_id: orderRef.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        };
        
        const itemRef = await addDoc(collection(db, 'order_items'), orderItemData);
        orderItems.push({
          id: itemRef.id,
          ...orderItemData
        });

        // Update product stock and increment sold count
        const currentSoldCount = item.product.sold_count || 0;
        await updateDoc(firestoreDoc(db, 'products', item.product.id), {
          stock: item.product.stock - item.quantity,
          sold_count: currentSoldCount + item.quantity,
        });
      }

      // Create order with items for invoice
      const orderWithItems: OrderWithItems = {
        id: orderRef.id,
        ...orderData,
        order_items: orderItems
      };

      // Track sale in localStorage if user is staff
      if (currentUser && isStaff(currentUser)) {
        const staffSale: StaffSale = {
          orderId: orderRef.id,
          total: cartTotal,
          subtotal: cartSubtotal,
          tax: cartTax,
          paymentMode: paymentMethod,
          timestamp: new Date().toISOString(),
          items: cart.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity,
          })),
        };
        
        addSaleToStorage(currentUser.email, staffSale);
      }

      toast({
        title: 'Order placed successfully!',
        description: `Order #${orderRef.id.slice(-6)} has been created`,
      });

      // Show invoice dialog and trigger print
      setCompletedOrder(orderWithItems);
      setInvoiceDialogOpen(true);
      
      // Trigger print after a short delay
      setTimeout(() => {
        const printButton = document.querySelector('[data-print-invoice]') as HTMLButtonElement;
        if (printButton) {
          printButton.click();
        }
      }, 500);

      clearCart();
      loadProducts(); // Refresh products to show updated stock
    } catch (error: any) {
      toast({
        title: 'Error placing order',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));
  
  // Get subcategories for the selected category
  const subCategories = categoryFilter !== 'all' 
    ? Array.from(new Set(
        products
          .filter(p => p.category === categoryFilter && p.subCategory)
          .map(p => p.subCategory!)
      ))
    : [];

  const categoryIcons: Record<string, any> = {
    'Bar': Wine,
    'Food': UtensilsCrossed,
    'Wine': Wine,
    'Soup': Soup,
    'Pizzas': Pizza,
    'Fish': Fish,
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Main Content */}
      <div className="lg:mr-96 p-4 sm:p-6 pb-24 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Category</h1>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 transition-all ${
            categoryFilter === 'all'
              ? 'bg-[#f8f1d8] border-[#c7a956]'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <Wine className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
          <span className="text-[10px] sm:text-xs font-medium">All Items</span>
        </button>

        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || UtensilsCrossed;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 transition-all ${
                categoryFilter === cat
                  ? 'bg-[#f8f1d8] border-[#c7a956]'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
              <span className="text-[10px] sm:text-xs font-medium">{cat}</span>
            </button>
          );
        })}
        </div>

        {/* SubCategory Filter - Show only when a category is selected */}
        {subCategories.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Select SubCategory</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSubCategoryFilter('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                  subCategoryFilter === 'all'
                    ? 'bg-[#f8f1d8] border-[#c7a956] text-gray-900'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All {categoryFilter}
              </button>
              {subCategories.map((subCat) => (
                <button
                  key={subCat}
                  onClick={() => setSubCategoryFilter(subCat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                    subCategoryFilter === subCat
                      ? 'bg-[#f8f1d8] border-[#c7a956] text-gray-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {subCat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special Menu Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Special Menu for you</h2>
        </div>

          {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c7a956]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first product</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-[#c7a956] hover:bg-[#bc994e]">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden border-2 transition-all hover:shadow-lg border-[#f1e6bc]"
            >
              <CardContent className="p-4">
                {/* Product Image */}
                <div className="relative w-full aspect-square mb-3 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="text-center mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  {product.subCategory && (
                    <p className="text-xs text-gray-400 mt-1">{product.subCategory}</p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-3">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </p>
                </div>

                {/* Add Button */}
                <Button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-[#c7a956] hover:bg-[#bc994e] text-white rounded-full h-11"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  ADD
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>

      {/* Cart Overlay for Mobile/Tablet */}
      {cartDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCartDrawerOpen(false)}
        />
      )}

      {/* Cart Sidebar/Drawer - Responsive */}
      <div className={cn(
        "w-full sm:w-96 bg-white shadow-xl flex flex-col fixed right-0 z-50 transition-transform duration-300",
        "top-0 h-screen lg:top-[88px] lg:h-[calc(100vh-88px)]",
        "lg:translate-x-0 lg:border-l",
        cartDrawerOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Cart Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-[#c7a956]" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Current Order</h2>
            </div>
            {/* Close Button - Mobile/Tablet Only */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setCartDrawerOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">{cartItemCount} items in cart</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium">Your cart is empty</p>
              <p className="text-xs sm:text-sm">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
                  {cart.map((item) => (
                    <Card key={item.product.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Item Image */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.product.image_url ? (
                              <img 
                                src={item.product.image_url} 
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                              {item.product.name}
                            </h3>
                            {item.product.subCategory && (
                              <p className="text-xs text-gray-400 mb-1">{item.product.subCategory}</p>
                            )}
                            <p className="text-[#bc994e] font-bold text-lg mb-2">
                              {formatCurrency(item.product.price)}
                            </p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-full"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-semibold">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-full"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                    <span className="font-medium">{formatCurrency(cartTax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total</span>
                    <span className="text-[#bc994e]">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'Cash' ? "default" : "outline"}
                      className={`flex-1 flex items-center justify-center gap-2 ${paymentMethod === 'Cash' ? 'bg-gray-900 hover:bg-gray-950' : ''}`}
                      onClick={() => setPaymentMethod('Cash')}
                    >
                      <Banknote className="w-4 h-4" />
                      Cash
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'Card' ? "default" : "outline"}
                      className={`flex-1 flex items-center justify-center gap-2 ${paymentMethod === 'Card' ? 'bg-gray-900 hover:bg-gray-950' : ''}`}
                      onClick={() => setPaymentMethod('Card')}
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </Button>
                  </div>
                </div>

                {/* Payment Status Toggle */}
               
                <div className="space-y-2">
                  <Button
                    onClick={submitOrder}
                    disabled={isSubmittingOrder}
                    className="w-full bg-[#c7a956] hover:bg-[#bc994e] text-white h-12 text-lg font-semibold rounded-full"
                  >
                    {isSubmittingOrder ? 'Processing...' : `Place Order • ${formatCurrency(cartTotal)}`}
                  </Button>
                  <Button
                    onClick={clearCart}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Cart
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Cart Button - Fixed Bottom Right for Mobile/Tablet */}
      <Button 
        onClick={() => setCartDrawerOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-[#c7a956] hover:bg-[#bc994e] z-30 transition-all hover:scale-110"
        size="icon"
      >
        <ShoppingCart className="w-6 h-6" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full min-w-[28px] h-7 flex items-center justify-center px-2 shadow-lg animate-pulse">
            {cartItemCount}
          </span>
        )}
      </Button>

      <ProductDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
        product={editingProduct}
      />

      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        order={completedOrder}
      />
    </div>
  );
}