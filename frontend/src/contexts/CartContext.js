import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user || user === false) {
      setItems([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/cart`);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity, size, color) => {
    if (!user || user === false) {
      return { success: false, error: 'Please login to add items to cart' };
    }
    
    try {
      await axios.post(`${API}/cart`, { product_id: productId, quantity, size, color });
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to add to cart' };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await axios.put(`${API}/cart/${itemId}?quantity=${quantity}`);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update cart' };
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove item' };
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart`);
      setItems([]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to clear cart' };
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);
  const shipping = subtotal >= 25000 ? 0 : 2500;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{
      items,
      loading,
      itemCount,
      subtotal,
      shipping,
      total,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
