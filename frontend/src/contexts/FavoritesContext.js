import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FavoritesContext = createContext(null);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!user || user === false) {
      setItems([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/favorites`);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addToFavorites = async (productId) => {
    if (!user || user === false) {
      return { success: false, error: 'Please login to add favorites' };
    }
    
    try {
      await axios.post(`${API}/favorites/${productId}`);
      await fetchFavorites();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to add to favorites' };
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      await axios.delete(`${API}/favorites/${productId}`);
      await fetchFavorites();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove from favorites' };
    }
  };

  const isFavorite = (productId) => {
    return items.some(item => item.id === productId);
  };

  const toggleFavorite = async (productId) => {
    if (isFavorite(productId)) {
      return removeFromFavorites(productId);
    } else {
      return addToFavorites(productId);
    }
  };

  return (
    <FavoritesContext.Provider value={{
      items,
      loading,
      count: items.length,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      toggleFavorite,
      fetchFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesProvider;
