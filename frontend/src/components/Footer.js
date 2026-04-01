import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-auto" data-testid="footer">
      <div className="container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="text-2xl tracking-tight font-medium block mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Outfit Shopci
            </Link>
            <p className="text-sm text-stone-600 leading-relaxed mb-6">
              Votre destination mode en Côte d'Ivoire. Des vêtements et accessoires tendance pour hommes et femmes.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-stone-600 hover:text-black transition-colors">
                <Instagram className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="text-stone-600 hover:text-black transition-colors">
                <Facebook className="w-5 h-5" strokeWidth={1.5} />
              </a>
              <a href="#" className="text-stone-600 hover:text-black transition-colors">
                <Twitter className="w-5 h-5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">Boutique</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products?category=robes" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Robes
                </Link>
              </li>
              <li>
                <Link to="/products?category=tops" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Tops
                </Link>
              </li>
              <li>
                <Link to="/products?category=pantalons" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Pantalons
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessoires" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Accessoires
                </Link>
              </li>
              <li>
                <Link to="/products?bestseller=true" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">Aide</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-stone-600 hover:text-black transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Livraison & Retours
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Guide des Tailles
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Conditions Générales
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-stone-600 hover:text-black transition-colors">
                  Politique de Confidentialité
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-stone-600">
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                Abidjan, Côte d'Ivoire
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-600">
                <Phone className="w-4 h-4" strokeWidth={1.5} />
                +225 07 00 00 00 00
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-600">
                <Mail className="w-4 h-4" strokeWidth={1.5} />
                contact@outfitshopci.com
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-stone-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-stone-500">
              © 2024 Outfit Shopci. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-500">Paiements acceptés:</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Orange Money</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">MTN Money</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Wave</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Moov Money</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
