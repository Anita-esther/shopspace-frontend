import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  message_text: string;
  created_at: string;
}

interface OtherUser {
  user_id: number;
  full_name: string;
  profile_image: string | null;
}

interface ThreadProduct {
  product_id: number;
  title: string;
  price: string;
  image_url: string | null;
}

const formatMoney = (price: string) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(
    Number(price)
  );

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatRoom: React.FC = () => {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [threadProduct, setThreadProduct] = useState<ThreadProduct | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    api
      .get<{ messages: Message[]; product: ThreadProduct | null }>(`/messages/${otherUserId}`, { auth: true })
      .then((res) => {
        setMessages(res.messages);
        setThreadProduct(res.product);
      });
  };

  useEffect(() => {
    api
      .get<{ user: OtherUser }>(`/auth/user/${otherUserId}`, { auth: true })
      .then((res) => setOtherUser(res.user))
      .catch(() => setOtherUser(null));

    loadMessages();
    const interval = setInterval(loadMessages, 4000); // poll for new messages
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft('');
    try {
      await api.post(
        '/messages',
        {
          receiver_id: Number(otherUserId),
          message_text: text,
          product_id: productId ? Number(productId) : undefined,
        },
        { auth: true }
      );
      loadMessages();
    } catch (err) {
      // Put the draft back if sending failed
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="market-page-outer">
      <div className="market-page ss-medium chat-room-card">
        <header className="ss-page-header">
          <Link to="/chats" className="ss-back-btn" aria-label="Back to chats">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </Link>
          <span className="chat-room-name">{otherUser?.full_name || 'Chat'}</span>
        </header>

        {threadProduct && (
          <Link to={`/market/product/${threadProduct.product_id}`} className="chat-product-banner">
            <div className="chat-product-banner-image">
              {threadProduct.image_url ? (
                <img src={threadProduct.image_url} alt={threadProduct.title} />
              ) : (
                <div className="market-card-placeholder">
                  <i className="ti ti-photo" aria-hidden="true"></i>
                </div>
              )}
            </div>
            <div className="chat-product-banner-body">
              <div className="chat-product-banner-title">{threadProduct.title}</div>
              <div className="chat-product-banner-price">{formatMoney(threadProduct.price)}</div>
            </div>
            <span className="chat-product-banner-link">View item</span>
          </Link>
        )}

        <div className="chat-room-messages">
          {messages.map((m) => {
            const mine = m.sender_id === user?.user_id;
            return (
              <div key={m.message_id} className={`chat-bubble-row ${mine ? 'mine' : ''}`}>
                <div className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                  <div>{m.message_text}</div>
                  <div className="chat-bubble-time">{formatTime(m.created_at)}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form className="chat-room-input-bar" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-room-input"
            placeholder="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="chat-room-send" disabled={sending || !draft.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
