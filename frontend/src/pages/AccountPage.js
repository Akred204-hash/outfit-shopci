import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Package, Heart, LogOut, Settings } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AccountPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOrdersPage = location.pathname.includes('/orders');

  useEffect(() => {
    if (!user || user === false) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${API}/orders`);
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/');
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

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'En attente', class: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Confirmée', class: 'bg-green-100 text-green-700' },
      processing: { label: 'En cours', class: 'bg-blue-100 text-blue-700' },
      shipped: { label: 'Expédiée', class: 'bg-purple-100 text-purple-700' },
      delivered: { label: 'Livrée', class: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Annulée', class: 'bg-red-100 text-red-700' }
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 text-xs rounded ${s.class}`}>{s.label}</span>;
  };

  if (!user || user === false) {
    return null;
  }

  return (
    <div className="min-h-screen pt-28 pb-16" data-testid="account-page">
      <div className="container-main">
        <h1 className="heading-2 mb-8">Mon Compte</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-stone-50 p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-200">
                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-stone-500">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link
                  to="/account"
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    !isOrdersPage ? 'bg-white font-medium' : 'hover:bg-white'
                  }`}
                  data-testid="account-profile-link"
                >
                  <User className="w-4 h-4" />
                  Mon Profil
                </Link>
                <Link
                  to="/account/orders"
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isOrdersPage ? 'bg-white font-medium' : 'hover:bg-white'
                  }`}
                  data-testid="account-orders-link"
                >
                  <Package className="w-4 h-4" />
                  Mes Commandes
                </Link>
                <Link
                  to="/favorites"
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white transition-colors"
                  data-testid="account-favorites-link"
                >
                  <Heart className="w-4 h-4" />
                  Mes Favoris
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {!isOrdersPage ? (
              /* Profile Section */
              <div className="bg-white p-8 border border-stone-200" data-testid="profile-section">
                <h2 className="heading-3 mb-6">Informations du Compte</h2>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-1">Nom</label>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-1">Email</label>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-1">Téléphone</label>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-200 mt-8 pt-8">
                  <h3 className="font-medium mb-4">Statistiques</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-stone-50 p-4 text-center">
                      <p className="text-2xl font-medium">{orders.length}</p>
                      <p className="text-sm text-stone-500">Commandes</p>
                    </div>
                    <div className="bg-stone-50 p-4 text-center">
                      <p className="text-2xl font-medium">
                        {orders.filter(o => o.status === 'delivered').length}
                      </p>
                      <p className="text-sm text-stone-500">Livrées</p>
                    </div>
                    <div className="bg-stone-50 p-4 text-center">
                      <p className="text-2xl font-medium">
                        {formatPrice(orders.reduce((sum, o) => sum + o.total, 0))}
                      </p>
                      <p className="text-sm text-stone-500">FCFA dépensés</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Orders Section */
              <div data-testid="orders-section">
                <h2 className="heading-3 mb-6">Historique des Commandes</h2>

                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white p-6 border border-stone-200 animate-pulse">
                        <div className="h-4 bg-stone-200 w-1/4 mb-4"></div>
                        <div className="h-4 bg-stone-200 w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white p-8 border border-stone-200 text-center">
                    <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500 mb-4">Aucune commande pour le moment</p>
                    <Link to="/products" className="btn-primary inline-block">
                      Commencer mes achats
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="bg-white p-6 border border-stone-200"
                        data-testid={`order-${order.id}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
                          <div>
                            <p className="text-sm text-stone-500">
                              Commande #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusBadge(order.status)}
                            <span className="font-medium">{formatPrice(order.total)} FCFA</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-12 h-16 bg-stone-100">
                                {item.product_image && (
                                  <img 
                                    src={item.product_image} 
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                                <p className="text-xs text-stone-500">Qté: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex items-center">
                              <span className="text-sm text-stone-500">
                                +{order.items.length - 3} autre(s)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
