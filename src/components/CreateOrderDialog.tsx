import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, type Product } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  payment_mode: z.string().min(1, 'Payment mode is required'),
});

type FormData = z.infer<typeof formSchema>;

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOrderDialog({ open, onClose, onSuccess }: CreateOrderDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      payment_mode: 'Cash',
    },
  });

  useEffect(() => {
    if (open) {
      loadProducts();
      setOrderItems([]);
      form.reset();
    }
  }, [open, form]);

  const loadProducts = async () => {
    try {
      // Fetch all products and filter in memory to avoid composite index requirement
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
      
      // Filter products with stock > 0 and sort by name
      const filteredProducts = productsData
        .filter(p => p.stock > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    if (quantity > product.stock) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${product.stock} units available`,
        variant: 'destructive',
      });
      return;
    }

    const existingItem = orderItems.find((item) => item.product_id === selectedProduct);
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        toast({
          title: 'Insufficient stock',
          description: `Only ${product.stock} units available`,
          variant: 'destructive',
        });
        return;
      }
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.price,
              }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          price: Number(product.price),
          total: quantity * Number(product.price),
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== productId));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const onSubmit = async (data: FormData) => {
    if (orderItems.length === 0) {
      toast({
        title: 'Add items to order',
        description: 'Please add at least one item to the order',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create order
      const orderData = {
        customer_name: data.customer_name,
        payment_mode: data.payment_mode,
        payment_status: 'Paid',
        subtotal,
        tax,
        total,
        created_at: new Date().toISOString(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Create order items
      const items = orderItems.map((item) => ({
        order_id: orderRef.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      for (const item of items) {
        await addDoc(collection(db, 'order_items'), item);
      }

      // Update product stock
      for (const item of orderItems) {
        const product = products.find((p) => p.id === item.product_id);
        if (product) {
          await updateDoc(doc(db, 'products', item.product_id), {
            stock: product.stock - item.quantity,
          });
        }
      }

      toast({ title: 'Order created successfully' });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error creating order',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormLabel>Add Products</FormLabel>
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${Number(product.price).toFixed(2)} (Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-24"
                  placeholder="Qty"
                />
                <Button type="button" onClick={addItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {orderItems.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Total
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orderItems.map((item) => (
                      <tr key={item.product_id}>
                        <td className="px-4 py-3 text-sm">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          ${item.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.product_id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {orderItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Order</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
