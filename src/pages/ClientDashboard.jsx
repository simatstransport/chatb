import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [finishers, setFinishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFinishers();
  }, []);

  const fetchFinishers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'finisher');
      
      if (error) throw error;
      setFinishers(data || []);
    } catch (err) {
      console.error('Error fetching finishers:', err);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (finisherId) => {
    try {
      // Check if conversation already exists
      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', profile.id)
        .eq('finisher_id', finisherId)
        .eq('type', 'client_finisher')
        .maybeSingle();

      if (searchError) throw searchError;

      if (existing) {
        navigate(`/chat/${existing.id}`);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            client_id: profile.id,
            finisher_id: finisherId,
            type: 'client_finisher'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        navigate(`/chat/${newConv.id}`);
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-10 animate-slide-up">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome, {profile?.username}</h1>
          <p className="text-gray-400 text-lg">Select a Finisher to start a secure, auto-expiring conversation.</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-200 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-primary-500" />
            Available Finishers
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-6 h-40 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : finishers.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center animate-fade-in border-dashed border-gray-700">
            <Shield className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Finishers Available</h3>
            <p className="text-gray-400">There are currently no Finishers online. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishers.map((finisher) => (
              <div key={finisher.id} className="glass-card p-6 flex flex-col justify-between transition-all hover:scale-105 hover:border-primary-500/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold border border-gray-700">
                      {finisher.username ? finisher.username.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{finisher.username}</h3>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <div className={`w-2 h-2 rounded-full ${finisher.is_online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></div>
                        <span className="text-xs text-gray-400">
                          {finisher.is_online 
                            ? 'Online' 
                            : finisher.last_seen 
                              ? `Last seen ${formatDistanceToNow(new Date(finisher.last_seen), { addSuffix: true })}` 
                              : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startChat(finisher.id)}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-gray-800 hover:bg-primary-600 border border-gray-700 hover:border-transparent rounded-lg text-sm font-medium text-white transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-400 group-hover:text-white" />
                  Start Secure Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
