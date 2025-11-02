import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db, type Product } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc as firestoreDoc, orderBy, query, getDoc } from 'firebase/firestore';
import { ProductDialog } from '@/components/ProductDialog';
import { useToast } from '@/hooks/use-toast';

interface StoreSettings {
  currency: string;
  lowStockThreshold: number;
}

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<StoreSettings>({
    currency: 'AED',
    lowStockThreshold: 10,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter]);

  const loadSettings = async () => {
    try {
      const docRef = firestoreDoc(db, 'settings', 'store');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          currency: data.currency || 'AED',
          lowStockThreshold: data.lowStockThreshold || 10,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currency} ${amount.toFixed(2)}`;
  };

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

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteDoc(firestoreDoc(db, 'products', id));
      toast({ 
        title: 'Product deleted',
        description: `${name} has been removed from inventory`,
      });
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error deleting product',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSaveSuccess = () => {
    loadProducts();
    handleDialogClose();
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Add, edit, and manage your inventory
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          className="bg-[#bda15e] hover:bg-[#b38d42] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-gradient-to-br from-[#cfb579] to-[#bda15e] text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#f1e6bc]">Total Products</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{products.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        

        

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-100">Categories</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{categories.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bda15e]"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {searchQuery || categoryFilter !== 'all' ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first product'}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <Button onClick={() => setDialogOpen(true)} className="bg-[#bda15e] hover:bg-[#b38d42]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 sm:w-20">Image</TableHead>
                    <TableHead className="min-w-[120px]">Product Name</TableHead>
                    <TableHead className="hidden sm:table-cell">product_id</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Price</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Sold</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                    >
                      <TableCell>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-xs text-gray-500 sm:hidden">{product.product_id}</span>
                          <span className="text-xs text-gray-500 md:hidden">{product.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm hidden sm:table-cell">{product.product_id}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="px-2 py-1 bg-[#f1e6bc] text-black rounded-md text-xs font-medium whitespace-nowrap">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm whitespace-nowrap">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        <span className="px-3 py-1 bg-[#f1e6bc] text-black rounded-md text-xs font-bold">
                          {product.sold_count || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="text-black hover:text-black hover:bg-[#f8f1d8] h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id, product.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
        product={editingProduct}
      />
    </div>
  );
}
