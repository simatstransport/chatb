import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield, User } from 'lucide-react';
import { supabase } from '../services/supabase';
import { generateUniqueUsername } from '../utils/usernameGenerator';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!role) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError(null);
    
    // Admin override protection: ensure they don't select admin. The DB function handles the real admin override anyway.
    const selectedRole = role === 'client' ? 'client' : 'finisher';

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: selectedRole,
        }
      }
    });
    
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Now generate username (DB trigger handles profile creation, but it leaves username null if not provided in raw_meta_data)
    // Actually, we can update the profile with the generated username immediately after signup
    try {
      const username = await generateUniqueUsername(selectedRole);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('profiles').update({ username }).eq('id', user.id);
        setGeneratedUsername(username);
        setSuccess(true);
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      console.error("Error setting username:", err);
      // Still navigate since auth succeeded
      navigate('/');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-10 text-center animate-slide-up">
          <Shield className="w-16 h-16 text-primary-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Identity Generated</h2>
          <p className="text-gray-400 mb-6">Your secure identity has been created.</p>
          <div className="bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-700">
            <p className="text-sm text-gray-500 mb-2">Your superhero alias is</p>
            <p className="text-2xl font-bold text-primary-400">{generatedUsername}</p>
          </div>
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-full flex items-center justify-center p-8">
        <div className="max-w-md w-full glass-card p-10 animate-slide-up">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 mb-8">Join the secure communication network</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Role Selection</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${role === 'client' ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}`}
                >
                  <User className={`w-8 h-8 mb-2 ${role === 'client' ? 'text-primary-400' : 'text-gray-500'}`} />
                  <span className={`font-semibold ${role === 'client' ? 'text-primary-400' : 'text-gray-400'}`}>CLIENT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('finisher')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${role === 'finisher' ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'}`}
                >
                  <Shield className={`w-8 h-8 mb-2 ${role === 'finisher' ? 'text-primary-400' : 'text-gray-500'}`} />
                  <span className={`font-semibold ${role === 'finisher' ? 'text-primary-400' : 'text-gray-400'}`}>FINISHER</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-500"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-500"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !role}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
