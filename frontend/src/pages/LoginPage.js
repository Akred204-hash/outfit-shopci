import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      toast.success('Connexion réussie');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 flex items-center justify-center" data-testid="login-page">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="heading-2 mb-2">Connexion</h1>
          <p className="text-stone-500">Accédez à votre compte Outfit Shopci</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 border border-stone-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 focus:border-black focus:outline-none"
                placeholder="votre@email.com"
                required
                data-testid="login-email"
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
                  data-testid="login-password"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-6"
            data-testid="login-submit"
          >
            {loading ? 'Connexion...' : 'Se Connecter'}
          </button>

          <p className="text-center text-sm text-stone-500 mt-6">
            Pas encore de compte?{' '}
            <Link to="/register" className="text-black hover:underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
