import { useEffect, useState } from 'react';
import { Plus, Trash2, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db, type OrderWithItems, type Product } from '@/lib/firebase';
import { doc, updateDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface EditOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: OrderWithItems | null;
  currencySymbol?: string;
}

interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export function EditOrderDialog({
  open,
  onClose,
  onSuccess,
  order,
  currencySymbol = 'AED',
}: EditOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<string>('Pending');
  const [taxRate, setTaxRate] = useState(0.1);
  const [showProductModal, setShowProductModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadProducts();
      loadTaxRate();
      if (order) {
        setOrderItems(order.order_items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })));
        setPaymentMode(order.payment_mode);
        setPaymentStatus(order.payment_status);
      }
    }
  }, [open, order]);

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadTaxRate = async () => {
    try {
      const settingsDoc = await getDocs(collection(db, 'settings'));
      if (!settingsDoc.empty) {
        const settingsData = settingsDoc.docs[0].data();
        setTaxRate((settingsData.taxRate || 10) / 100);
      }
    } catch (error) {
      console.error('Error loading tax rate:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toFixed(2)}`;
  };

  const addItem = () => {
    if (products.length === 0) {
      toast({
        title: 'No products available',
        description: 'Add products first to include in the order',
        variant: 'destructive',
      });
      return;
    }

    setShowProductModal(true);
  };

  const addProductToOrder = (product: Product) => {
    setOrderItems([...orderItems, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price,
      total: product.price,
    }]);
    setShowProductModal(false);
    toast({
      title: 'Product added',
      description: `${product.name} has been added to the order`,
    });
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    const item = newItems[index];

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.product_id = product.id;
        item.product_name = product.name;
        item.price = product.price;
        item.total = product.price * item.quantity;
      }
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, parseInt(value) || 1);
      item.total = item.price * item.quantity;
    }

    setOrderItems(newItems);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!order) return;
    
    if (orderItems.length === 0) {
      toast({
        title: 'No items',
        description: 'Please add at least one item to the order',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Update order
      await updateDoc(doc(db, 'orders', order.id), {
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        subtotal,
        tax,
        total,
      });

      // Delete existing order items
      const existingItems = order.order_items;
      for (const item of existingItems) {
        await deleteDoc(doc(db, 'order_items', item.id));
      }

      // Add new order items
      for (const item of orderItems) {
        await addDoc(collection(db, 'order_items'), {
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        });
      }

      toast({
        title: 'Order updated',
        description: 'Order has been updated successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error updating order',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Order #{order?.id.slice(-6)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Order Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Product Selection */}
                      <div className="md:col-span-5">
                        <Label className="text-xs mb-1">Product</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <Label className="text-xs mb-1">Quantity</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => updateItem(index, 'quantity', item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="h-9 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-2">
                        <Label className="text-xs mb-1">Price</Label>
                        <Input
                          value={formatCurrency(item.price)}
                          disabled
                          className="h-9 bg-gray-50"
                        />
                      </div>

                      {/* Total */}
                      <div className="md:col-span-2">
                        <Label className="text-xs mb-1">Total</Label>
                        <Input
                          value={formatCurrency(item.total)}
                          disabled
                          className="h-9 bg-gray-50 font-semibold"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="md:col-span-1 md:mt-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items in this order. Click "Add Item" to add products.</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          {orderItems.length > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-[#bc994e]">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || orderItems.length === 0}
              className="bg-[#c7a956] hover:bg-[#bc994e]"
            >
              {loading ? 'Updating...' : 'Update Order'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Product Selection Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Product to Add</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#c7a956]"
                onClick={() => addProductToOrder(product)}
              >
                <CardContent className="p-4">
                  {/* Product Image */}
                  <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    <p className="text-lg font-bold text-[#c7a956]">
                      {formatCurrency(product.price)}
                    </p>
                    
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
