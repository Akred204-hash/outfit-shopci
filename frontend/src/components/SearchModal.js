import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '../components/ui/dialog';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SearchModal = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/products?search=${encodeURIComponent(query)}&limit=6`);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
    onClose();
    setQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      onClose();
      setQuery('');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-white">
        <form onSubmit={handleSearch} className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-lg focus:outline-none bg-transparent"
              autoFocus
              data-testid="search-input"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            )}
          </div>
        </form>

        {results.length > 0 && (
          <div className="p-4 max-h-96 overflow-y-auto">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">Résultats</p>
            <div className="space-y-3">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="flex items-center gap-4 w-full p-2 hover:bg-stone-50 rounded-sm transition-colors text-left"
                  data-testid={`search-result-${product.id}`}
                >
                  <div className="w-16 h-20 bg-stone-100 flex-shrink-0">
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-sm text-stone-500">{formatPrice(product.price)} FCFA</p>
                  </div>
                </button>
              ))}
            </div>
            {query && (
              <button
                onClick={handleSearch}
                className="w-full mt-4 py-3 text-sm text-center border border-black hover:bg-black hover:text-white transition-colors"
              >
                Voir tous les résultats pour "{query}"
              </button>
            )}
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className="text-stone-500">Aucun résultat pour "{query}"</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
