import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import ChatInput from '../components/ChatInput';
import MessageBubble from '../components/MessageBubble';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const { messages, loading, error, sendMessage } = useChat(conversationId, profile?.id);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBack = () => {
    if (profile?.role === 'admin') navigate('/admin');
    else if (profile?.role === 'finisher') navigate('/finisher');
    else navigate('/client');
  };

  if (loading && messages.length === 0) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
        <img src="/asclogo.jpg" alt="Loading..." className="w-16 h-16 mb-4 object-contain filter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
        <p className="text-gray-400">Establishing secure connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-center p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6">You don't have permission to view this conversation or it doesn't exist.</p>
        <button onClick={handleBack} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'MMMM d, yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Chat Header */}
      <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 shadow-sm z-10">
        <button 
          onClick={handleBack}
          className="p-2 mr-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-lg font-bold text-primary-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
            {/* Show other participant's info conceptually - we could fetch this in useChat for a better UI */}
            <ShieldAlert className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">Secure Channel</h2>
            <p className="text-xs text-green-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
              Encrypted Session
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-gray-950 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <ShieldAlert className="w-12 h-12 text-gray-500 mb-3" />
            <p className="text-gray-400">This conversation is secure.<br/>Messages disappear after 24 hours.</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-6">
                <span className="px-3 py-1 bg-gray-800/80 rounded-full text-xs font-medium text-gray-400 border border-gray-700/50 backdrop-blur-sm shadow-sm">
                  {date}
                </span>
              </div>
              {dateMessages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isOwn={msg.sender_id === profile?.id} 
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
}
