'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  Send,
  Sparkles,
  TrendingUp,
  Newspaper,
  Search,
  Target,
  Crosshair,
  Zap,
  ChevronUp,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAuth, UserTier } from '@/lib/auth';

// ============================================================
// CoinDebrief V2 — AI Intelligence Page
// "Your personal crypto analyst. Just meaner."
// ============================================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: string[];
  queryType?: string;
  timestamp: Date;
}

interface UsageData {
  queriesUsed: number;
  queriesLimit: number;
  queriesRemaining: number;
  totalTokensToday: number;
}

const QUICK_ACTIONS = [
  {
    label: 'Market Brief',
    icon: TrendingUp,
    prompt: "What's happening in the crypto market right now?",
    queryType: 'market_brief',
    minTier: 'normie' as UserTier,
  },
  {
    label: 'News Analysis',
    icon: Newspaper,
    prompt: 'Analyze the top crypto news stories today. Separate signal from noise.',
    queryType: 'news_analysis',
    minTier: 'night_owl' as UserTier,
  },
  {
    label: 'Trend Scanner',
    icon: Search,
    prompt: 'What crypto narratives and sectors are gaining momentum right now?',
    queryType: 'trend_scan',
    minTier: 'night_owl' as UserTier,
  },
  {
    label: 'BTC Deep Dive',
    icon: Target,
    prompt: 'Give me a deep research analysis on Bitcoin — price action, on-chain data, macro outlook.',
    queryType: 'deep_research',
    minTier: 'coin_sense' as UserTier,
  },
  {
    label: 'ETH Deep Dive',
    icon: Target,
    prompt: 'Give me a deep research analysis on Ethereum — price action, ecosystem activity, upcoming catalysts.',
    queryType: 'deep_research',
    minTier: 'coin_sense' as UserTier,
  },
  {
    label: 'Portfolio Check',
    icon: Crosshair,
    prompt: 'Analyze my portfolio against current market conditions. Any red flags?',
    queryType: 'portfolio_ai',
    minTier: 'coin_sense' as UserTier,
  },
];

const TIER_HIERARCHY: UserTier[] = ['normie', 'night_owl', 'coin_sense'];

function hasAccess(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_HIERARCHY.indexOf(userTier) >= TIER_HIERARCHY.indexOf(requiredTier);
}

export default function AIPage() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch usage on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsage();
    }
  }, [isAuthenticated]);

  async function fetchUsage() {
    try {
      const res = await fetch('/api/ai/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Failed to fetch AI usage:', err);
    }
  }

  async function sendMessage(content: string, queryType?: string) {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowQuickActions(false);

    try {
      // Build portfolio context if needed
      let portfolioContext: string | undefined;
      if (queryType === 'portfolio_ai') {
        try {
          const portfolioRes = await fetch('/api/portfolio');
          if (portfolioRes.ok) {
            const portfolioData = await portfolioRes.json();
            if (portfolioData.holdings?.length > 0) {
              portfolioContext = portfolioData.holdings
                .map((h: { name: string; symbol: string; amount: number; buy_price: number }) =>
                  `${h.name} (${h.symbol}): ${h.amount} units, bought at $${h.buy_price}`
                )
                .join('\n');
            }
          }
        } catch {
          // Portfolio fetch failed, proceed without context
        }
      }

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          queryType,
          context: portfolioContext ? { portfolio: portfolioContext } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: data.message || data.error || 'Something went wrong.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          citations: data.citations,
          queryType: data.queryType,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        // Update usage
        if (data.usage) {
          setUsage(data.usage);
        }
      }
    } catch (err) {
      console.error('AI query error:', err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: "Connection failed. Even our AI has internet problems sometimes. The irony isn't lost on us.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const userTier = user?.tier || 'normie';

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-title">
          <Brain size={28} />
          <div>
            <h1>AI Intelligence</h1>
            <p>Powered by Perplexity Sonar — real-time crypto analysis with attitude</p>
          </div>
        </div>
        {usage && (
          <div className="ai-usage-badge">
            <Zap size={14} />
            <span>
              {usage.queriesRemaining}/{usage.queriesLimit} queries left
            </span>
            <div
              className="ai-usage-bar"
              style={{
                width: `${((usage.queriesLimit - usage.queriesRemaining) / usage.queriesLimit) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="ai-messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-welcome-icon">
              <Sparkles size={40} />
            </div>
            <h2>Ask me anything about crypto.</h2>
            <p>
              I&apos;ll search the internet in real-time, give you actual data,
              and be honest about it. Brutally honest.
            </p>

            {/* Quick Actions */}
            {showQuickActions && (
              <div className="ai-quick-actions">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const locked = !hasAccess(userTier, action.minTier);

                  return (
                    <button
                      key={action.label}
                      className={`ai-quick-action ${locked ? 'ai-quick-action--locked' : ''}`}
                      onClick={() => {
                        if (!locked) sendMessage(action.prompt, action.queryType);
                      }}
                      disabled={locked || loading}
                    >
                      {locked ? <Lock size={16} /> : <Icon size={16} />}
                      <span>{action.label}</span>
                      {locked && (
                        <span className="ai-quick-action-tier">
                          {action.minTier === 'night_owl' ? 'Night Owl' : 'Coin Sense'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ai-message--${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="ai-message-avatar">
                <Brain size={18} />
              </div>
            )}
            <div className="ai-message-content">
              {msg.role === 'system' ? (
                <div className="ai-message-system">
                  <AlertCircle size={16} />
                  <span>{msg.content}</span>
                </div>
              ) : (
                <div
                  className="ai-message-text"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(msg.content),
                  }}
                />
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div className="ai-citations">
                  <span className="ai-citations-label">Sources:</span>
                  {msg.citations.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-citation-link"
                    >
                      [{i + 1}]
                    </a>
                  ))}
                </div>
              )}
              {msg.queryType && msg.role === 'assistant' && (
                <span className="ai-query-type-badge">{msg.queryType.replace(/_/g, ' ')}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-message ai-message--assistant">
            <div className="ai-message-avatar">
              <Brain size={18} />
            </div>
            <div className="ai-message-content">
              <div className="ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="ai-input-area">
        {messages.length > 0 && (
          <button
            className="ai-quick-actions-toggle"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <ChevronUp
              size={16}
              style={{
                transform: showQuickActions ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
            Quick actions
          </button>
        )}
        {messages.length > 0 && showQuickActions && (
          <div className="ai-quick-actions ai-quick-actions--compact">
            {QUICK_ACTIONS.filter(a => hasAccess(userTier, a.minTier)).map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="ai-quick-action ai-quick-action--small"
                  onClick={() => sendMessage(action.prompt, action.queryType)}
                  disabled={loading}
                >
                  <Icon size={14} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="ai-input-row">
          <textarea
            ref={inputRef}
            className="ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any coin, market trends, or your portfolio..."
            rows={1}
            disabled={loading}
          />
          <button
            className="ai-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="ai-input-footer">
          <span>Powered by Perplexity Sonar • Real-time search • Not financial advice (obviously)</span>
        </div>
      </div>
    </div>
  );
}

// ==================== MARKDOWN FORMATTER ====================

function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    // Wrap in paragraph
    .replace(/^(.*)$/, '<p>$1</p>');
}
