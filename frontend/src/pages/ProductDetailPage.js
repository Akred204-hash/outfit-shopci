import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Minus, Plus, ChevronLeft, ChevronRight, Truck, RefreshCw, Shield } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [productRes, reviewsRes] = await Promise.all([
          axios.get(`${API}/products/${id}`),
          axios.get(`${API}/reviews/${id}`)
        ]);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
        
        if (productRes.data.sizes?.length > 0) {
          setSelectedSize(productRes.data.sizes[0]);
        }
        if (productRes.data.colors?.length > 0) {
          setSelectedColor(productRes.data.colors[0]);
        }

        // Fetch related products
        const relatedRes = await axios.get(`${API}/products?category=${productRes.data.category}&limit=4`);
        setRelatedProducts(relatedRes.data.filter(p => p.id !== id).slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Produit non trouvé');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user || user === false) {
      toast.error('Connectez-vous pour ajouter au panier');
      navigate('/login');
      return;
    }

    if (!selectedSize) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }

    if (!selectedColor) {
      toast.error('Veuillez sélectionner une couleur');
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(product.id, quantity, selectedSize, selectedColor);
    setAddingToCart(false);

    if (result.success) {
      toast.success('Ajouté au panier');
    } else {
      toast.error(result.error);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user || user === false) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }
    
    const result = await toggleFavorite(product.id);
    if (result.success) {
      toast.success(isFavorite(product.id) ? 'Retiré des favoris' : 'Ajouté aux favoris');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || user === false) {
      toast.error('Connectez-vous pour laisser un avis');
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(`${API}/reviews`, {
        product_id: product.id,
        rating: reviewRating,
        comment: reviewComment
      });
      
      // Refresh reviews
      const { data } = await axios.get(`${API}/reviews/${id}`);
      setReviews(data);
      
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Avis publié avec succès');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getColorStyle = (color) => {
    const colorMap = {
      'noir': '#000',
      'blanc': '#fff',
      'beige': '#d4b896',
      'rouge': '#dc2626',
      'bleu marine': '#1e3a5f',
      'gris': '#6b7280',
      'rose': '#f472b6',
      'rose poudré': '#e8b4b8',
      'marron': '#8b4513',
      'doré': '#d4af37',
      'argent': '#c0c0c0'
    };
    return colorMap[color.toLowerCase()] || '#e5e7eb';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28">
        <div className="container-main">
          <div className="grid md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-[3/4] bg-stone-200"></div>
            <div className="space-y-4">
              <div className="h-8 bg-stone-200 w-3/4"></div>
              <div className="h-6 bg-stone-200 w-1/4"></div>
              <div className="h-24 bg-stone-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="min-h-screen pt-28" data-testid="product-detail-page">
      <div className="container-main">
        {/* Breadcrumb */}
        <nav className="text-sm text-stone-500 mb-8">
          <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Accueil</span>
          <span className="mx-2">/</span>
          <span className="hover:text-black cursor-pointer" onClick={() => navigate('/products')}>Produits</span>
          <span className="mx-2">/</span>
          <span className="text-stone-900">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
              <img
                src={product.images?.[currentImageIndex] || 'https://via.placeholder.com/600x800'}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="product-main-image"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_new && <span className="badge-promo">Nouveau</span>}
                {discount > 0 && <span className="badge-sale">-{discount}%</span>}
                {product.is_bestseller && (
                  <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 uppercase tracking-wider font-semibold">
                    Best Seller
                  </span>
                )}
              </div>

              {/* Navigation arrows */}
              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : product.images.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(i => i < product.images.length - 1 ? i + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-24 bg-stone-100 overflow-hidden ${index === currentImageIndex ? 'ring-2 ring-black' : ''}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="overline">{product.category}</span>
              <h1 className="heading-2 mt-2" data-testid="product-name">{product.name}</h1>
              
              {/* Rating */}
              {product.reviews_count > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-stone-500">
                    {product.rating} ({product.reviews_count} avis)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-medium" data-testid="product-price">
                {formatPrice(product.price)} FCFA
              </span>
              {product.original_price && (
                <span className="text-lg text-stone-400 line-through">
                  {formatPrice(product.original_price)} FCFA
                </span>
              )}
            </div>

            <p className="text-stone-600 leading-relaxed">{product.description}</p>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Couleur: <span className="font-normal">{selectedColor}</span></h4>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-black' : 'border-stone-200'}`}
                      style={{ backgroundColor: getColorStyle(color) }}
                      title={color}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Taille: <span className="font-normal">{selectedSize}</span></h4>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border text-sm transition-colors ${
                        selectedSize === size 
                          ? 'border-black bg-black text-white' 
                          : 'border-stone-300 hover:border-black'
                      }`}
                      data-testid={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h4 className="text-sm font-medium mb-3">Quantité</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-300">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-3 hover:bg-stone-100"
                    data-testid="quantity-minus"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-center min-w-[50px]" data-testid="quantity-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-3 hover:bg-stone-100"
                    data-testid="quantity-plus"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-stone-500">
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="w-4 h-4" />
                {addingToCart ? 'Ajout...' : 'Ajouter au Panier'}
              </button>
              <button
                onClick={handleFavoriteClick}
                className={`p-3 border transition-colors ${
                  isFavorite(product.id) 
                    ? 'border-red-500 bg-red-50 text-red-500' 
                    : 'border-stone-300 hover:border-black'
                }`}
                data-testid="favorite-btn"
              >
                <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            {/* Features */}
            <div className="border-t border-stone-200 pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-stone-600" strokeWidth={1.5} />
                <span>Livraison gratuite à partir de 25 000 FCFA</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RefreshCw className="w-5 h-5 text-stone-600" strokeWidth={1.5} />
                <span>Retours gratuits sous 14 jours</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-stone-600" strokeWidth={1.5} />
                <span>Paiement sécurisé par Mobile Money</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-20 border-t border-stone-200 pt-12" data-testid="reviews-section">
          <div className="flex items-center justify-between mb-8">
            <h2 className="heading-3">Avis Clients ({reviews.length})</h2>
            {user && user !== false && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn-secondary"
                data-testid="write-review-btn"
              >
                Écrire un avis
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-stone-50 p-6 mb-8" data-testid="review-form">
              <h4 className="font-medium mb-4">Votre avis</h4>
              
              <div className="mb-4">
                <label className="block text-sm mb-2">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-2">Commentaire</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  required
                  className="w-full p-3 border border-stone-300 focus:border-black focus:outline-none resize-none"
                  placeholder="Partagez votre expérience..."
                  data-testid="review-comment"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary"
                  data-testid="submit-review-btn"
                >
                  {submittingReview ? 'Envoi...' : 'Publier'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-stone-500 text-center py-8">
              Aucun avis pour le moment. Soyez le premier à donner votre avis!
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-stone-200 pb-6" data-testid={`review-${review.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{review.user_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">{review.user_name}</h5>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">{formatDate(review.created_at)}</span>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 border-t border-stone-200 pt-12 pb-16" data-testid="related-products">
            <h2 className="heading-3 mb-8">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
