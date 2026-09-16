import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Activity, Users, ShieldCheck, Database, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ clients: 0, finishers: 0, conversations: 0, messages24h: 0 });
  const [finishers, setFinishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Finishers
      const { data: finisherData } = await supabase.from('profiles').select('*').eq('role', 'finisher');
      setFinishers(finisherData || []);

      // Fetch Stats
      const { count: clientsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client');
      const { count: finishersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'finisher');
      const { count: convCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
      
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', yesterday);

      setStats({
        clients: clientsCount || 0,
        finishers: finishersCount || 0,
        conversations: convCount || 0,
        messages24h: msgCount || 0
      });

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startFinisherChat = async (finisherId) => {
    try {
      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('admin_id', profile.id)
        .eq('finisher_id', finisherId)
        .eq('type', 'admin_finisher')
        .maybeSingle();

      if (searchError) throw searchError;

      if (existing) {
        navigate(`/chat/${existing.id}`);
      } else {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            admin_id: profile.id,
            finisher_id: finisherId,
            type: 'admin_finisher'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        navigate(`/chat/${newConv.id}`);
      }
    } catch (err) {
      console.error('Error starting admin chat:', err);
      alert('Failed to connect to Finisher.');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-10 animate-fade-in flex items-center">
          <ShieldCheck className="w-12 h-12 text-red-500 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">Command Center</h1>
            <p className="text-gray-400">System overview and Finisher management.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Clients</p>
                <h3 className="text-3xl font-bold text-white">{stats.clients}</h3>
              </div>
              <Users className="w-8 h-8 text-blue-500/50" />
            </div>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Finishers</p>
                <h3 className="text-3xl font-bold text-white">{stats.finishers}</h3>
              </div>
              <ShieldCheck className="w-8 h-8 text-purple-500/50" />
            </div>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Active Conversations</p>
                <h3 className="text-3xl font-bold text-white">{stats.conversations}</h3>
              </div>
              <Activity className="w-8 h-8 text-green-500/50" />
            </div>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Messages (24h)</p>
                <h3 className="text-3xl font-bold text-white">{stats.messages24h}</h3>
              </div>
              <Database className="w-8 h-8 text-yellow-500/50" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-200 mb-6 border-b border-gray-800 pb-2">Registered Finishers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="text-gray-400">Loading finishers...</div>
          ) : finishers.map(finisher => (
             <div key={finisher.id} className="glass-card p-6 flex flex-col justify-between">
               <div className="flex items-center space-x-4 mb-6">
                 <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center font-bold text-xl">
                   {finisher.username?.charAt(0) || 'F'}
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-white">{finisher.username}</h3>
                   <p className="text-xs text-gray-400">{finisher.email}</p>
                 </div>
               </div>
               <button
                  onClick={() => startFinisherChat(finisher.id)}
                  className="w-full flex items-center justify-center py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Secure Channel
                </button>
             </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
