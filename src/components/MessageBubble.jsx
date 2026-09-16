import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { Clock } from 'lucide-react';

export default function MessageBubble({ message, isOwn }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // If it's an image, fetch the signed URL or public URL
    if (message.message_type === 'image' && message.image_url) {
      const fetchImage = async () => {
        // Since we created a private bucket, we use createSignedUrl
        const { data, error } = await supabase.storage
          .from('chat-images')
          .createSignedUrl(message.image_url, 3600); // 1 hour expiry for link
        
        if (data) {
          setImageUrl(data.signedUrl);
        }
      };
      fetchImage();
    }
  }, [message.message_type, message.image_url]);

  useEffect(() => {
    // Calculate time left for expiration
    const updateTimeLeft = () => {
      const expires = new Date(message.expires_at).getTime();
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m left`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [message.expires_at]);

  // Don't render if expired (fallback in case DB cleanup is delayed)
  if (new Date(message.expires_at) < new Date()) {
    return null;
  }

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs text-gray-400 mb-1 ml-1">{message.sender?.username}</span>
        )}
        
        <div 
          className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isOwn 
              ? 'bg-primary-600 text-white rounded-tr-sm' 
              : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
          }`}
        >
          {message.message_type === 'image' ? (
            <div className="flex flex-col">
              {imageUrl ? (
                <img src={imageUrl} alt="Chat attachment" className="rounded-lg max-h-64 object-contain mb-2 bg-gray-900/50" />
              ) : (
                <div className="w-48 h-48 bg-gray-900 rounded-lg flex items-center justify-center animate-pulse">
                  Loading image...
                </div>
              )}
              {message.message && <p className="text-sm">{message.message}</p>}
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${isOwn ? 'mr-1' : 'ml-1'}`}>
          <span>{format(new Date(message.created_at), 'h:mm a')}</span>
          <span className="flex items-center text-red-400/80" title="Time until self-destruct">
            <Clock className="w-3 h-3 mr-1" />
            {timeLeft}
          </span>
        </div>
      </div>
    </div>
  );
}
