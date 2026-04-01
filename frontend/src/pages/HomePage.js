import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, RefreshCw, Gift } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, bestsellersRes, newArrivalsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products?is_featured=true&limit=4`),
          axios.get(`${API}/products?is_bestseller=true&limit=4`),
          axios.get(`${API}/products?sort=newest&limit=4`),
          axios.get(`${API}/categories`)
        ]);
        
        setFeaturedProducts(featuredRes.data);
        setBestsellers(bestsellersRes.data);
        setNewArrivals(newArrivalsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px]" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1772714601004-23b94ae3913d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHw0fHxtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMG1vZGVsJTIwYmVpZ2UlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NDk5MzY2N3ww&ixlib=rb-4.1.0&q=85"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <div className="relative container-main h-full flex items-center">
          <div className="max-w-xl animate-fadeIn">
            <span className="overline text-white/80 mb-4 block">Nouvelle Collection</span>
            <h1 className="heading-1 text-white mb-6">
              L'Élégance Moderne
            </h1>
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              Découvrez notre collection exclusive de vêtements et accessoires pour hommes et femmes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary bg-white text-black hover:bg-stone-100" data-testid="shop-now-btn">
                Découvrir
              </Link>
              <Link to="/products?category=robes" className="btn-secondary border-white text-white hover:bg-white/10">
                Collection Femmes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-stone-900 text-white py-4" data-testid="promo-banner">
        <div className="container-main">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <Gift className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
            <p className="text-sm">
              <span className="font-semibold">BIENVENUE10</span> - Utilisez ce code pour obtenir 10% de réduction sur votre première commande!
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-stone-200">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <Truck className="w-8 h-8 text-stone-700" strokeWidth={1} />
              <div>
                <h4 className="font-medium text-sm">Livraison Gratuite</h4>
                <p className="text-xs text-stone-500">À partir de 25 000 FCFA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Shield className="w-8 h-8 text-stone-700" strokeWidth={1} />
              <div>
                <h4 className="font-medium text-sm">Paiement Sécurisé</h4>
                <p className="text-xs text-stone-500">Mobile Money</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RefreshCw className="w-8 h-8 text-stone-700" strokeWidth={1} />
              <div>
                <h4 className="font-medium text-sm">Retours Faciles</h4>
                <p className="text-xs text-stone-500">Sous 14 jours</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Star className="w-8 h-8 text-stone-700" strokeWidth={1} />
              <div>
                <h4 className="font-medium text-sm">Qualité Premium</h4>
                <p className="text-xs text-stone-500">100% Authentique</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding" data-testid="categories-section">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10">
            <h2 className="heading-2">Nos Catégories</h2>
            <Link to="/products" className="text-sm text-stone-600 hover:text-black flex items-center gap-2 transition-colors">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group relative aspect-[3/4] overflow-hidden bg-stone-100"
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`category-${category.id}`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute inset-0 flex items-end p-4">
                  <h3 className="text-white text-sm uppercase tracking-wider font-medium">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section-padding bg-stone-50" data-testid="bestsellers-section">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="overline mb-2 block">Les Plus Vendus</span>
              <h2 className="heading-2">Best Sellers</h2>
            </div>
            <Link to="/products?bestseller=true" className="text-sm text-stone-600 hover:text-black flex items-center gap-2 transition-colors">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 aspect-[3/4]"></div>
                  <div className="mt-4 h-4 bg-stone-200 rounded w-3/4"></div>
                  <div className="mt-2 h-4 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner */}
      <section className="relative py-24" data-testid="collection-banner">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/20837265/pexels-photo-20837265.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="relative container-main text-center">
          <span className="overline text-white/80 mb-4 block">Collection Exclusive</span>
          <h2 className="heading-1 text-white mb-6">Mode Femme</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Découvrez notre sélection de vêtements élégants pour femmes modernes.
          </p>
          <Link to="/products?category=robes" className="btn-primary bg-white text-black hover:bg-stone-100">
            Découvrir la Collection
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-padding" data-testid="new-arrivals-section">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="overline mb-2 block">Fraîchement Arrivés</span>
              <h2 className="heading-2">Nouveautés</h2>
            </div>
            <Link to="/products?sort=newest" className="text-sm text-stone-600 hover:text-black flex items-center gap-2 transition-colors">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 aspect-[3/4]"></div>
                  <div className="mt-4 h-4 bg-stone-200 rounded w-3/4"></div>
                  <div className="mt-2 h-4 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-stone-900 text-white" data-testid="newsletter-section">
        <div className="container-main text-center">
          <h2 className="heading-2 text-white mb-4">Restez Informé</h2>
          <p className="text-stone-400 mb-8 max-w-md mx-auto">
            Inscrivez-vous à notre newsletter pour recevoir les dernières nouveautés et offres exclusives.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-stone-400 focus:outline-none focus:border-white"
              data-testid="newsletter-email"
            />
            <button type="submit" className="btn-primary bg-white text-black hover:bg-stone-100" data-testid="newsletter-submit">
              S'inscrire
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
