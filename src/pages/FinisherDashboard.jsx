import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Users, ShieldAlert, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FinisherDashboard() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to changes in conversations to update UI dynamically
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `finisher_id=eq.${profile?.id}` }, () => {
        fetchConversations();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          last_message_at,
          client:profiles!client_id(id, username, is_online, last_seen)
        `)
        .eq('finisher_id', profile.id)
        .eq('type', 'client_finisher')
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (id) => {
    navigate(`/chat/${id}`);
  };

  const startAdminChat = async () => {
    try {
      // Find the admin user
      const { data: admins, error: adminErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
        
      if (adminErr) throw adminErr;
      
      if (!admins || admins.length === 0) {
        alert("Admin account not initialized yet.");
        return;
      }
      
      const adminId = admins[0].id;
      
      // Check for existing admin_finisher conversation
      const { data: existing, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('finisher_id', profile.id)
        .eq('admin_id', adminId)
        .eq('type', 'admin_finisher')
        .maybeSingle();

      if (searchError) throw searchError;

      if (existing) {
        navigate(`/chat/${existing.id}`);
      } else {
        // Create new
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            admin_id: adminId,
            finisher_id: profile.id,
            type: 'admin_finisher'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        navigate(`/chat/${newConv.id}`);
      }
    } catch (err) {
      console.error('Error starting admin chat:', err);
      alert('Failed to connect to Admin.');
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-slide-up gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Finisher Hub</h1>
            <p className="text-gray-400 text-lg">Manage your secure client communications.</p>
          </div>
          <button 
            onClick={startAdminChat}
            className="flex items-center px-4 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700/50 rounded-lg transition-colors shadow-lg"
          >
            <ShieldAlert className="w-5 h-5 mr-2" />
            Connect with Admin
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-200 flex items-center">
            <Users className="w-6 h-6 mr-3 text-primary-500" />
            Client Conversations
          </h2>
        </div>

        <div className="bg-gray-800/40 rounded-2xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading active conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Clients</h3>
              <p className="text-gray-400">Clients will appear here when they initiate a conversation.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {conversations.map((conv) => (
                <li 
                  key={conv.id}
                  onClick={() => openChat(conv.id)}
                  className="p-4 hover:bg-gray-800/80 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold border border-gray-600">
                      {conv.client?.username ? conv.client.username.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center">
                        {conv.client?.username || 'Unknown Client'}
                        {conv.client?.is_online && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center">
                        Last active: {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
