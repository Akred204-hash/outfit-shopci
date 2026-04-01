import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const Navbar = ({ onSearchOpen }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Nouveautés', href: '/products?sort=newest' },
    { name: 'Femmes', href: '/products?category=robes' },
    { name: 'Hommes', href: '/products?category=ensembles' },
    { name: 'Accessoires', href: '/products?category=accessoires' },
    { name: 'Best Sellers', href: '/products?bestseller=true' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 nav-glass" data-testid="navbar">
      <div className="container-main">
        {/* Promo Banner */}
        <div className="bg-black text-white text-center py-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4">
          <p className="text-xs tracking-wider">
            LIVRAISON GRATUITE À PARTIR DE 25 000 FCFA | Code: <span className="font-semibold">BIENVENUE10</span> pour -10%
          </p>
        </div>

        {/* Main Nav */}
        <nav className="flex items-center justify-between h-16">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2" data-testid="mobile-menu-button">
                  <Menu className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <Link to="/" className="text-2xl tracking-tight font-medium" style={{ fontFamily: 'Cormorant Garamond, serif' }} onClick={() => setMobileMenuOpen(false)}>
                      Outfit Shopci
                    </Link>
                  </div>
                  <nav className="flex-1 p-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="block py-3 text-stone-600 hover:text-black transition-colors border-b border-stone-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link to="/" className="text-xl md:text-2xl tracking-tight font-medium" style={{ fontFamily: 'Cormorant Garamond, serif' }} data-testid="logo">
            Outfit Shopci
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm text-stone-600 hover:text-black transition-colors tracking-wide"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-stone-100 rounded-sm transition-colors"
              onClick={onSearchOpen}
              data-testid="search-button"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {user && user !== false ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-stone-100 rounded-sm transition-colors" data-testid="user-menu-button">
                    <User className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    Mon Compte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account/orders')}>
                    Mes Commandes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="p-2 hover:bg-stone-100 rounded-sm transition-colors" data-testid="login-button">
                <User className="w-5 h-5" strokeWidth={1.5} />
              </Link>
            )}

            <Link to="/favorites" className="p-2 hover:bg-stone-100 rounded-sm transition-colors relative" data-testid="favorites-button">
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="p-2 hover:bg-stone-100 rounded-sm transition-colors relative" data-testid="cart-button">
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
