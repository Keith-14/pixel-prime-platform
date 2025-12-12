import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const products = [
  {
    id: 1,
    name: 'TASBIH',
    price: 20.00,
    image: '/placeholder-tasbih.png',
  },
  {
    id: 2,
    name: 'PRAYER RUG',
    price: 35.00,
    image: '/placeholder-rug.png',
  },
  {
    id: 3,
    name: 'QURAN',
    price: 25.00,
    image: '/placeholder-quran.png',
  },
  {
    id: 4,
    name: 'ISLAMIC BOOK',
    price: 15.00,
    image: '/placeholder-book.png',
  },
];

export const Shop = () => {
  const { addToCart, getTotalItems } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Shop</h1>
          <Button variant="ghost" className="relative text-primary" onClick={handleCartClick}>
            <ShoppingCart className="h-5 w-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 bg-card border-border rounded-full"
            />
          </div>
          <Button variant="outline" className="rounded-full border-border">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4 rounded-2xl bg-card">
              <div className="aspect-square bg-secondary rounded-xl mb-3 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-full"></div>
                </div>
              </div>
              <h3 className="font-semibold text-primary text-center mb-1">
                {product.name}
              </h3>
              <p className="text-lg font-bold text-foreground text-center mb-3">
                ${product.price.toFixed(2)}
              </p>
              <Button 
                variant="outline" 
                className="w-full rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleAddToCart(product)}
              >
                ADD TO CART
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
