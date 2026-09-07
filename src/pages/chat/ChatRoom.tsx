import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Message {
  message_id: number;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
}

interface OtherUser {
  user_id: string;
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

  const loadMessages = async () => {
    if (!user || !otherUserId) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.user_id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.user_id})`
      )
      .order('created_at', { ascending: true })
      .limit(500);
    setMessages((data as Message[]) || []);

    // Mark incoming messages as read (RLS only allows updating rows where
    // we're the receiver, which is exactly what this targets).
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.user_id)
      .eq('is_read', false);

    // Most recently referenced product in this thread, for the banner.
    const { data: productRows } = await supabase
      .from('messages')
      .select('product:products(product_id, title, price, image_url)')
      .or(
        `and(sender_id.eq.${user.user_id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.user_id})`
      )
      .not('product_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    const first: any = (productRows || [])[0];
    setThreadProduct(first?.product || null);
  };

  useEffect(() => {
    if (!otherUserId) return;

    supabase
      .from('users')
      .select('user_id, full_name, profile_image')
      .eq('user_id', otherUserId)
      .single()
      .then(({ data }) => setOtherUser((data as OtherUser) || null));

    loadMessages();
    const interval = setInterval(loadMessages, 4000); // poll for new messages
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !otherUserId) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft('');
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.user_id,
        receiver_id: otherUserId,
        message_text: text,
        product_id: productId ? Number(productId) : null,
      });
      if (error) throw new Error(error.message);
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
