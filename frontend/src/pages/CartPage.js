import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const CartPage = () => {
  const { items, loading, subtotal, shipping, total, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const result = await updateQuantity(itemId, newQuantity);
    if (!result.success) {
      toast.error(result.error);
    }
  };

  const handleRemove = async (itemId) => {
    const result = await removeItem(itemId);
    if (result.success) {
      toast.success('Produit retiré du panier');
    } else {
      toast.error(result.error);
    }
  };

  const handleCheckout = () => {
    if (!user || user === false) {
      toast.error('Connectez-vous pour passer commande');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28">
        <div className="container-main">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-stone-100">
                <div className="w-24 h-32 bg-stone-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-200 w-3/4"></div>
                  <div className="h-4 bg-stone-200 w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user === false) {
    return (
      <div className="min-h-screen pt-28" data-testid="cart-page">
        <div className="container-main">
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" strokeWidth={1} />
            <h1 className="heading-2 mb-4">Votre Panier</h1>
            <p className="text-stone-500 mb-8">Connectez-vous pour voir votre panier</p>
            <Link to="/login" className="btn-primary inline-block">
              Se Connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-28" data-testid="cart-page">
        <div className="container-main">
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" strokeWidth={1} />
            <h1 className="heading-2 mb-4">Votre Panier est Vide</h1>
            <p className="text-stone-500 mb-8">Découvrez nos collections et trouvez votre style</p>
            <Link to="/products" className="btn-primary inline-block">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16" data-testid="cart-page">
      <div className="container-main">
        <h1 className="heading-2 mb-8">Mon Panier ({items.length})</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-4 p-4 border border-stone-200 bg-white"
                data-testid={`cart-item-${item.id}`}
              >
                {/* Image */}
                <Link to={`/products/${item.product_id}`} className="w-24 h-32 bg-stone-100 flex-shrink-0">
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/100x130'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div>
                      <Link 
                        to={`/products/${item.product_id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-sm text-stone-500 mt-1">
                        Taille: {item.size} | Couleur: {item.color}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1 hover:bg-stone-100 rounded"
                      data-testid={`remove-item-${item.id}`}
                    >
                      <X className="w-4 h-4 text-stone-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-stone-300">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-stone-100"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-stone-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.product?.price * item.quantity)} FCFA</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-stone-500">{formatPrice(item.product?.price)} FCFA/unité</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-stone-50 p-6 sticky top-32" data-testid="cart-summary">
              <h3 className="font-medium text-lg mb-6">Récapitulatif</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Sous-total</span>
                  <span>{formatPrice(subtotal)} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Livraison</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Gratuite</span>
                    ) : (
                      `${formatPrice(shipping)} FCFA`
                    )}
                  </span>
                </div>
                
                {subtotal < 25000 && (
                  <div className="bg-amber-50 p-3 text-xs flex items-start gap-2">
                    <Truck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700">
                      Plus que <strong>{formatPrice(25000 - subtotal)} FCFA</strong> pour la livraison gratuite!
                    </p>
                  </div>
                )}

                <div className="border-t border-stone-200 pt-3 flex justify-between font-medium">
                  <span>Total</span>
                  <span data-testid="cart-total">{formatPrice(total)} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full btn-primary mt-6 flex items-center justify-center gap-2"
                data-testid="checkout-btn"
              >
                Passer Commande
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link 
                to="/products" 
                className="block text-center text-sm text-stone-600 hover:text-black mt-4 transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
