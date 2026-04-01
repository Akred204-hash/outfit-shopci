import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Smartphone, Truck } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, shipping, total, fetchCart } = useCart();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  // Form state
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', color: 'bg-orange-100 border-orange-300 text-orange-700' },
    { id: 'mtn_money', name: 'MTN Money', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
    { id: 'wave', name: 'Wave', color: 'bg-blue-100 border-blue-300 text-blue-700' },
    { id: 'moov_money', name: 'Moov Money', color: 'bg-green-100 border-green-300 text-green-700' }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    try {
      const { data } = await axios.post(
        `${API}/promo-codes/validate?code=${promoCode}&subtotal=${subtotal}`
      );
      setPromoDiscount(data.discount_amount);
      setPromoApplied(true);
      toast.success(`Code promo appliqué: -${data.discount_percent}%`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Code promo invalide');
      setPromoDiscount(0);
      setPromoApplied(false);
    }
  };

  const handleSubmitShipping = (e) => {
    e.preventDefault();
    if (!shippingAddress || !shippingCity || !shippingPhone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setStep(2);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }
    setStep(3);
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    
    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })),
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_phone: shippingPhone,
        payment_method: paymentMethod,
        promo_code: promoApplied ? promoCode : null
      };

      const { data } = await axios.post(`${API}/orders`, orderData);
      setOrder(data);
      setStep(4);
      fetchCart(); // Refresh cart (will be empty)
      toast.success('Commande créée avec succès!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/orders/${order.id}/payment`);
      setStep(5);
      toast.success('Paiement confirmé!');
    } catch (error) {
      toast.error('Erreur lors de la confirmation du paiement');
    } finally {
      setLoading(false);
    }
  };

  const finalTotal = total - promoDiscount;

  // Redirect if no items or not logged in
  if (!user || user === false) {
    navigate('/login');
    return null;
  }

  if (items.length === 0 && step < 4) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-16 bg-stone-50" data-testid="checkout-page">
      <div className="container-main">
        {/* Back button */}
        {step < 4 && (
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/cart')}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-black mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? 'Étape précédente' : 'Retour au panier'}
          </button>
        )}

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {['Livraison', 'Paiement', 'Confirmation', 'Résumé'].map((label, index) => (
            <React.Fragment key={label}>
              <div className={`flex items-center gap-2 ${index + 1 <= step ? 'text-black' : 'text-stone-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  index + 1 < step ? 'bg-green-600 text-white' : 
                  index + 1 === step ? 'bg-black text-white' : 
                  'bg-stone-200'
                }`}>
                  {index + 1 < step ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="hidden sm:inline text-sm">{label}</span>
              </div>
              {index < 3 && <div className={`w-8 sm:w-16 h-0.5 ${index + 1 < step ? 'bg-green-600' : 'bg-stone-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <form onSubmit={handleSubmitShipping} className="bg-white p-8" data-testid="shipping-form">
              <h2 className="heading-3 mb-6">Adresse de Livraison</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse complète</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Quartier, Rue, Bâtiment..."
                    className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                    required
                    data-testid="shipping-address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ville</label>
                  <input
                    type="text"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="Abidjan, Bouaké, Yamoussoukro..."
                    className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                    required
                    data-testid="shipping-city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                    required
                    data-testid="shipping-phone"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary mt-8" data-testid="continue-to-payment">
                Continuer vers le paiement
              </button>
            </form>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <form onSubmit={handleSubmitPayment} className="bg-white p-8" data-testid="payment-form">
              <h2 className="heading-3 mb-6">Mode de Paiement</h2>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                      paymentMethod === method.id 
                        ? 'border-black bg-stone-50' 
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                    data-testid={`payment-${method.id}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <Smartphone className="w-6 h-6" />
                    <span className="flex-1 font-medium">{method.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${method.color}`}>Mobile Money</span>
                  </label>
                ))}
              </div>

              <button type="submit" className="w-full btn-primary mt-8" data-testid="continue-to-confirm">
                Continuer
              </button>
            </form>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="bg-white p-8" data-testid="order-confirmation">
              <h2 className="heading-3 mb-6">Récapitulatif de la Commande</h2>

              {/* Order Items */}
              <div className="border-b border-stone-200 pb-6 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-3">
                    <div className="w-16 h-20 bg-stone-100">
                      <img
                        src={item.product?.images?.[0]}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product?.name}</h4>
                      <p className="text-xs text-stone-500">
                        Taille: {item.size} | Couleur: {item.color} | Qté: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatPrice(item.product?.price * item.quantity)} FCFA
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Code Promo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="BIENVENUE10"
                    className="flex-1 px-4 py-3 border border-stone-300 focus:border-black focus:outline-none uppercase"
                    disabled={promoApplied}
                    data-testid="promo-code-input"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoApplied}
                    className="btn-secondary"
                    data-testid="apply-promo-btn"
                  >
                    {promoApplied ? 'Appliqué' : 'Appliquer'}
                  </button>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-stone-50 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-stone-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Livraison</h4>
                    <p className="text-sm text-stone-600">{shippingAddress}</p>
                    <p className="text-sm text-stone-600">{shippingCity}</p>
                    <p className="text-sm text-stone-600">{shippingPhone}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-stone-50 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-stone-600" />
                  <div>
                    <h4 className="font-medium text-sm">Paiement</h4>
                    <p className="text-sm text-stone-600">
                      {paymentMethods.find(m => m.id === paymentMethod)?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>{shipping === 0 ? 'Gratuite' : `${formatPrice(shipping)} FCFA`}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction</span>
                    <span>-{formatPrice(promoDiscount)} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total</span>
                  <span data-testid="final-total">{formatPrice(finalTotal)} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="w-full btn-primary mt-8"
                data-testid="confirm-order-btn"
              >
                {loading ? 'Traitement...' : 'Confirmer la Commande'}
              </button>
            </div>
          )}

          {/* Step 4: Payment Simulation */}
          {step === 4 && order && (
            <div className="bg-white p-8 text-center" data-testid="payment-simulation">
              <Smartphone className="w-16 h-16 mx-auto text-stone-600 mb-4" />
              <h2 className="heading-3 mb-4">Paiement Mobile Money</h2>
              <p className="text-stone-600 mb-6">
                Un message de confirmation a été envoyé à votre numéro de téléphone.<br />
                Veuillez confirmer le paiement sur votre téléphone.
              </p>

              <div className="bg-stone-50 p-6 mb-8 text-left max-w-sm mx-auto">
                <p className="text-sm text-stone-500 mb-2">Montant à payer</p>
                <p className="text-2xl font-medium">{formatPrice(order.total)} FCFA</p>
                <p className="text-sm text-stone-500 mt-4 mb-1">Méthode</p>
                <p className="font-medium">
                  {paymentMethods.find(m => m.id === order.payment_method)?.name}
                </p>
              </div>

              <p className="text-xs text-stone-500 mb-6">
                (Ceci est une simulation. Cliquez sur le bouton ci-dessous pour confirmer.)
              </p>

              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="btn-primary"
                data-testid="simulate-payment-btn"
              >
                {loading ? 'Confirmation...' : 'Simuler la Confirmation du Paiement'}
              </button>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && order && (
            <div className="bg-white p-8 text-center" data-testid="order-success">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="heading-3 mb-4">Commande Confirmée!</h2>
              <p className="text-stone-600 mb-2">
                Merci pour votre commande, {user.name}!
              </p>
              <p className="text-sm text-stone-500 mb-8">
                Numéro de commande: <span className="font-medium text-black">{order.id.slice(0, 8).toUpperCase()}</span>
              </p>

              <div className="bg-stone-50 p-6 text-left mb-8">
                <h4 className="font-medium mb-4">Récapitulatif</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total payé</span>
                    <span className="font-medium">{formatPrice(order.total)} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Statut</span>
                    <span className="text-green-600">Confirmé</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Livraison</span>
                    <span>{order.shipping_city}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/account/orders')}
                  className="btn-primary"
                  data-testid="view-orders-btn"
                >
                  Voir mes commandes
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="btn-secondary"
                >
                  Continuer mes achats
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
