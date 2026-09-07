import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Conversation {
  other_user_id: string;
  other_full_name: string;
  other_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  product_id: number | null;
  product_title: string | null;
  product_image_url: string | null;
}

const formatTime = (iso: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatsList: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase
      .rpc('get_conversations')
      .then(({ data }) => setConversations((data as Conversation[]) || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Poll every 5 seconds so new messages show up without a manual refresh
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="market-page-outer">
      <div className="market-page ss-medium">
        <header className="ss-page-header">
          <Link to="/market" className="ss-back-btn" aria-label="Back to market">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </Link>
          <h1>Chats</h1>
        </header>

        <div className="chats-list-page">
          {loading ? (
            <p className="market-status">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <div className="chats-empty">
              <i className="ti ti-message-circle-2" aria-hidden="true"></i>
              <p>No conversations yet. Message a seller from a product page to start one.</p>
            </div>
          ) : (
            <div className="chats-list">
              {conversations.map((c) => (
                <div
                  key={c.other_user_id}
                  className="chat-list-item"
                  onClick={() => navigate(`/chat/${c.other_user_id}`)}
                >
                  <div className="chat-avatar">
                    {c.other_avatar_url ? (
                      <img src={c.other_avatar_url} alt={c.other_full_name} />
                    ) : (
                      c.other_full_name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div className="chat-list-item-body">
                    <div className="chat-list-item-top">
                      <span className="chat-list-item-name">{c.other_full_name}</span>
                      <span className="chat-list-item-time">{formatTime(c.last_message_at)}</span>
                    </div>
                    <div className="chat-list-item-preview">
                      {c.product_title && (
                        <span className="chat-list-item-product-tag">{c.product_title}</span>
                      )}
                      {c.last_message || 'Say hello \ud83d\udc4b'}
                    </div>
                  </div>
                  {c.unread_count > 0 && (
                    <div className="chat-unread-badge">{c.unread_count}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsList;
