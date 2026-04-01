import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const result = await register(email, password, name, phone);
    setLoading(false);
    
    if (result.success) {
      toast.success('Compte créé avec succès');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center" data-testid="register-page">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="heading-2 mb-2">Créer un Compte</h1>
          <p className="text-stone-500">Rejoignez Outfit Shopci aujourd'hui</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 border border-stone-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                placeholder="John Doe"
                required
                data-testid="register-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                placeholder="votre@email.com"
                required
                data-testid="register-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                placeholder="+225 07 00 00 00 00"
                data-testid="register-phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none pr-12"
                  placeholder="••••••••"
                  required
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                placeholder="••••••••"
                required
                data-testid="register-confirm-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-6"
            data-testid="register-submit"
          >
            {loading ? 'Création...' : 'Créer mon Compte'}
          </button>

          <p className="text-center text-sm text-stone-500 mt-6">
            Déjà un compte?{' '}
            <Link to="/login" className="text-black hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
