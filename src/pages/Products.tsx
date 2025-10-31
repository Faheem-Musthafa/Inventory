import { useEffect, useState } from 'react';
import { Plus, Wine, UtensilsCrossed, Pizza, Soup, Fish, Package, ShoppingCart, Minus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { db, type Product } from '@/lib/firebase';
import { collection, getDocs, doc as firestoreDoc, orderBy, query, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ProductDialog } from '@/components/ProductDialog';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  quantity: number;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [currencySymbol, setCurrencySymbol] = useState('AED');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [taxRate, setTaxRate] = useState(0.1);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
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
        setLowStockThreshold(settings.lowStockThreshold || 10);
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
  }, [products, categoryFilter]);

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

    setFilteredProducts(filtered);
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
    if (product.stock <= 0) {
      toast({
        title: 'Out of stock',
        description: 'This item is currently unavailable',
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: 'Stock limit reached',
          description: `Only ${product.stock} available`,
          variant: 'destructive',
        });
        return;
      }
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

    const item = cart.find(item => item.product.id === productId);
    if (item && newQuantity > item.product.stock) {
      toast({
        title: 'Stock limit',
        description: `Only ${item.product.stock} available`,
        variant: 'destructive',
      });
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
      // Create order
      const orderData = {
        payment_mode: 'Cash', // Default, can be changed in dialog
        payment_status: 'Paid',
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        created_at: new Date().toISOString(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Add order items and update stock
      for (const item of cart) {
        await addDoc(collection(db, 'order_items'), {
          order_id: orderRef.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        });

        // Update product stock and increment sold count
        const currentSoldCount = item.product.sold_count || 0;
        await updateDoc(firestoreDoc(db, 'products', item.product.id), {
          stock: item.product.stock - item.quantity,
          sold_count: currentSoldCount + item.quantity,
        });
      }

      toast({
        title: 'Order placed successfully!',
        description: `Order #${orderRef.id.slice(-6)} has been created`,
      });

      clearCart();
      setShowCart(false);
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

  const categoryIcons: Record<string, any> = {
    'Bar': Wine,
    'Food': UtensilsCrossed,
    'Wine': Wine,
    'Soup': Soup,
    'Pizzas': Pizza,
    'Fish': Fish,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Category</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full relative"
            onClick={() => setShowCart(!showCart)}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
          <Button 
            size="icon" 
            className="rounded-full bg-emerald-500 hover:bg-emerald-600"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all ${
            categoryFilter === 'all'
              ? 'bg-emerald-50 border-emerald-500'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <Wine className="w-8 h-8 mb-2" />
          <span className="text-xs font-medium">Bar</span>
        </button>

        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || UtensilsCrossed;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-50 border-emerald-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Special Menu Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Special Menu for you</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first product</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className={`overflow-hidden border-2 transition-all hover:shadow-lg ${
                product.stock < lowStockThreshold ? 'border-gray-200' : 'border-emerald-100'
              }`}
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
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
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
                  disabled={product.stock <= 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {product.stock <= 0 ? 'OUT OF STOCK' : 'ADD'}
                </Button>

                {/* Stock Info */}
                <div className="mt-2 text-xs text-center">
                  {product.stock < lowStockThreshold ? (
                    <span className="text-red-600 font-medium">
                      Low Stock: {product.stock} left
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Stock: {product.stock}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCart(false)}
          />
          
          {/* Cart Panel */}
          <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
            {/* Cart Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Current Order</h2>
                <p className="text-sm text-gray-500">{cartItemCount} items</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCart(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm">Add items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                            <p className="text-emerald-600 font-bold text-lg mb-2">
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
                                disabled={item.quantity >= item.product.stock}
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
              <div className="border-t bg-gray-50 p-6">
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
                    <span className="text-emerald-600">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={submitOrder}
                    disabled={isSubmittingOrder}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-lg font-semibold rounded-full"
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
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
        product={editingProduct}
      />
    </div>
  );
}