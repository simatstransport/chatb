import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

export const useChat = (conversationId, profileId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select(`*, sender:profiles!sender_id(username, avatar_url)`)
          .eq('conversation_id', conversationId)
          .gt('expires_at', new Date().toISOString()) // Only non-expired
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages and deletions for this conversation
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}` 
      }, async (payload) => {
        // Fetch sender info for the new message
        const { data: senderInfo } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();
          
        setMessages(prev => [...prev, { ...payload.new, sender: senderInfo }]);
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}` 
      }, (payload) => {
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (text, file = null) => {
    try {
      let imageUrl = null;
      let messageType = 'text';

      if (file) {
        // Upload image
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;

        // Get public URL or signed URL. For private bucket, we must use signed URL or download.
        // Actually, since we created a private bucket, we'll store the path and create a signed url on render
        imageUrl = fileName;
        messageType = 'image';
      }

      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profileId,
          message: text,
          message_type: messageType,
          image_url: imageUrl,
        });

      if (insertError) throw insertError;
      
      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  return { messages, loading, error, sendMessage };
};
