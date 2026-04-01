import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';

const FavoritesPage = () => {
  const { items, loading } = useFavorites();
  const { user } = useAuth();

  if (!user || user === false) {
    return (
      <div className="min-h-screen pt-28" data-testid="favorites-page">
        <div className="container-main">
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" strokeWidth={1} />
            <h1 className="heading-2 mb-4">Mes Favoris</h1>
            <p className="text-stone-500 mb-8">Connectez-vous pour voir vos favoris</p>
            <Link to="/login" className="btn-primary inline-block">
              Se Connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28">
        <div className="container-main">
          <h1 className="heading-2 mb-8">Mes Favoris</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-stone-200 aspect-[3/4]"></div>
                <div className="mt-4 h-4 bg-stone-200 rounded w-3/4"></div>
                <div className="mt-2 h-4 bg-stone-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16" data-testid="favorites-page">
      <div className="container-main">
        <h1 className="heading-2 mb-8">Mes Favoris ({items.length})</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" strokeWidth={1} />
            <p className="text-stone-500 mb-8">Vous n'avez pas encore de favoris</p>
            <Link to="/products" className="btn-primary inline-block">
              Découvrir les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
