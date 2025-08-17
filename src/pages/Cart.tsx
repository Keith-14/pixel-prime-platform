import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const handleProceedToPay = () => {
    // We'll implement Stripe payment here
    console.log('Proceeding to payment...');
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="px-4 py-6 space-y-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/shop')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-sage">Shopping Cart</h1>
          </div>
          
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some items to your cart to get started</p>
            <Button 
              onClick={() => navigate('/shop')}
              className="bg-sage hover:bg-sage/90 text-primary-foreground"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/shop')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-sage">Shopping Cart</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={clearCart}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Clear Cart
          </Button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-sage-light rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 bg-sage/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-sage rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sage font-bold">${item.price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <Card className="p-4 rounded-2xl bg-sage/5">
          <h3 className="font-bold text-lg mb-4 text-sage">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-sage">Total</span>
                <span className="text-sage">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Checkout Button */}
        <Button 
          onClick={handleProceedToPay}
          className="w-full bg-sage hover:bg-sage/90 text-primary-foreground py-3 text-lg font-semibold rounded-2xl"
        >
          Proceed to Payment - ${total.toFixed(2)}
        </Button>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/shop')}
            className="text-sage"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </Layout>
  );
};