import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User } from 'lucide-react';
import { supabase } from '../services/supabase';
import { generateUniqueUsername } from '../utils/usernameGenerator';
import { useAuth } from '../hooks/useAuth';

export default function RoleSelection() {
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = async () => {
    if (!role) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Generate Username
      const username = await generateUniqueUsername(role);
      
      // 2. Update Profile with Role and Username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role, username })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // 3. Refresh Auth Profile
      await fetchProfile(user.id);
      
      navigate('/'); // Root will route properly based on role
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Path</h2>
          <p className="text-gray-400 text-lg">Select how you want to interact within Decochat</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setRole('client')}
            className={`glass-card p-8 text-left transition-all transform hover:scale-105 ${role === 'client' ? 'ring-2 ring-primary-500 bg-primary-900/20' : 'hover:bg-gray-800'}`}
          >
            <User className={`w-12 h-12 mb-4 ${role === 'client' ? 'text-primary-400' : 'text-gray-400'}`} />
            <h3 className={`text-2xl font-bold mb-2 ${role === 'client' ? 'text-white' : 'text-gray-200'}`}>CLIENT</h3>
            <p className="text-gray-400">Find a Finisher and start a private conversation. Secure and encrypted.</p>
          </button>

          <button
            onClick={() => setRole('finisher')}
            className={`glass-card p-8 text-left transition-all transform hover:scale-105 ${role === 'finisher' ? 'ring-2 ring-primary-500 bg-primary-900/20' : 'hover:bg-gray-800'}`}
          >
            <Shield className={`w-12 h-12 mb-4 ${role === 'finisher' ? 'text-primary-400' : 'text-gray-400'}`} />
            <h3 className={`text-2xl font-bold mb-2 ${role === 'finisher' ? 'text-white' : 'text-gray-200'}`}>FINISHER</h3>
            <p className="text-gray-400">Connect with Clients and communicate with the Admin. Professional access.</p>
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSelectRole}
            disabled={!role || loading}
            className="w-full md:w-auto px-12 py-3 border border-transparent rounded-full shadow-sm text-lg font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Finalizing Setup...' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
