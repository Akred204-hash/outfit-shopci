import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const ProductCard = ({ product }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const favorite = isFavorite(product.id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || user === false) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }
    
    const result = await toggleFavorite(product.id);
    if (result.success) {
      toast.success(favorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
    }
  };

  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <Link 
      to={`/products/${product.id}`} 
      className="product-card group block"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative overflow-hidden bg-stone-100 aspect-[3/4]">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/400x500'}
          alt={product.name}
          className="product-card-image w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_new && (
            <span className="badge-promo">Nouveau</span>
          )}
          {discount > 0 && (
            <span className="badge-sale">-{discount}%</span>
          )}
          {product.is_bestseller && (
            <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 uppercase tracking-wider font-semibold">
              Best Seller
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-sm hover:bg-white transition-colors"
          data-testid={`favorite-btn-${product.id}`}
        >
          <Heart 
            className={`w-4 h-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-stone-600'}`}
            strokeWidth={1.5}
          />
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium text-stone-900 line-clamp-1">{product.name}</h3>
        
        {/* Rating */}
        {product.reviews_count > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-stone-500">{product.rating} ({product.reviews_count})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatPrice(product.price)} FCFA</span>
          {product.original_price && (
            <span className="text-sm text-stone-400 line-through">
              {formatPrice(product.original_price)} FCFA
            </span>
          )}
        </div>

        {/* Colors */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {product.colors.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-full border border-stone-300"
                style={{ 
                  backgroundColor: 
                    color.toLowerCase() === 'noir' ? '#000' :
                    color.toLowerCase() === 'blanc' ? '#fff' :
                    color.toLowerCase() === 'beige' ? '#d4b896' :
                    color.toLowerCase() === 'rouge' ? '#dc2626' :
                    color.toLowerCase() === 'bleu marine' ? '#1e3a5f' :
                    color.toLowerCase() === 'gris' ? '#6b7280' :
                    color.toLowerCase() === 'rose' ? '#f472b6' :
                    color.toLowerCase() === 'rose poudré' ? '#e8b4b8' :
                    color.toLowerCase() === 'marron' ? '#8b4513' :
                    color.toLowerCase() === 'doré' ? '#d4af37' :
                    color.toLowerCase() === 'argent' ? '#c0c0c0' :
                    '#e5e7eb'
                }}
                title={color}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-stone-500">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
