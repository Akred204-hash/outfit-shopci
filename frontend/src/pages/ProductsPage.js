import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter states
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const isBestseller = searchParams.get('bestseller') === 'true';

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'];
  const colors = ['Noir', 'Blanc', 'Beige', 'Rouge', 'Bleu Marine', 'Gris', 'Rose'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`${API}/categories`);
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (isBestseller) params.append('is_bestseller', 'true');

        const { data } = await axios.get(`${API}/products?${params.toString()}`);
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, search, sort, minPrice, maxPrice, isBestseller]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount = [category, minPrice, maxPrice, isBestseller].filter(Boolean).length;

  const getCategoryName = () => {
    if (isBestseller) return 'Best Sellers';
    if (search) return `Résultats pour "${search}"`;
    const cat = categories.find(c => c.id === category);
    return cat ? cat.name : 'Tous les Produits';
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium text-sm uppercase tracking-wider mb-4">Catégories</h4>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('category', '')}
            className={`block w-full text-left py-2 text-sm ${!category ? 'font-medium' : 'text-stone-600 hover:text-black'}`}
          >
            Tous les produits
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', cat.id)}
              className={`block w-full text-left py-2 text-sm ${category === cat.id ? 'font-medium' : 'text-stone-600 hover:text-black'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-sm uppercase tracking-wider mb-4">Prix (FCFA)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilter('min_price', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 text-sm focus:outline-none focus:border-black"
          />
          <span className="text-stone-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 text-sm focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* Best Sellers */}
      <div>
        <h4 className="font-medium text-sm uppercase tracking-wider mb-4">Collection</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={isBestseller}
            onCheckedChange={(checked) => updateFilter('bestseller', checked ? 'true' : '')}
          />
          <span className="text-sm">Best Sellers uniquement</span>
        </label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-3 border border-black text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pt-28" data-testid="products-page">
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="heading-2">{getCategoryName()}</h1>
            <p className="text-sm text-stone-500 mt-1">{products.length} produits</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Filter */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden flex items-center gap-2 px-4 py-2 border border-stone-300 text-sm" data-testid="mobile-filter-btn">
                  <Filter className="w-4 h-4" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <span className="bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sort} onValueChange={(value) => updateFilter('sort', value)}>
              <SelectTrigger className="w-[180px]" data-testid="sort-select">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nouveautés</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="popular">Popularité</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterContent />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-stone-200 aspect-[3/4]"></div>
                    <div className="mt-4 h-4 bg-stone-200 rounded w-3/4"></div>
                    <div className="mt-2 h-4 bg-stone-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-stone-500 mb-4">Aucun produit trouvé</p>
                <button onClick={clearFilters} className="text-sm underline">
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
