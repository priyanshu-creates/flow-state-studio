import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { useTasks } from '@/hooks/useTasks';
import { toast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

function parseActions(content: string): { type: string; task_title?: string; title?: string; name?: string; task_name?: string; updates?: Record<string, string> }[] {
  const actions: any[] = [];
  const regex = /```action\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try { actions.push(JSON.parse(match[1].trim())); } catch {}
  }
  return actions;
}

function stripActionBlocks(content: string): string {
  return content.replace(/```action\s*\n[\s\S]*?```/g, '').trim();
}

export const ChatPanel = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tasks, updateTask, deleteTask } = useTasks();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const executeActions = useCallback((content: string) => {
    const actions = parseActions(content);
    for (const action of actions) {
      const resolvedTitle = action.task_title || action.title || action.name || action.task_name;
      if (!resolvedTitle) continue;
      const task = tasks.find(t => t.title.toLowerCase() === resolvedTitle.toLowerCase());
      if (!task) { toast({ title: `Task "${resolvedTitle}" not found`, variant: 'destructive' }); continue; }
      if (action.type === 'edit_task' && action.updates) {
        updateTask(task.id, action.updates);
        toast({ title: `Task "${task.title}" updated` });
      } else if (action.type === 'delete_task') {
        deleteTask(task.id);
        toast({ title: `Task "${task.title}" deleted` });
      }
    }
  }, [tasks, updateTask, deleteTask]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const taskContext = tasks.map(t => `[${t.status}] "${t.title}" (${t.priority} priority${t.category ? `, ${t.category}` : ''}${t.description ? ` — ${t.description}` : ''})`).join('\n');

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      const display = stripActionBlocks(assistantSoFar);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: display } : m));
        }
        return [...prev, { role: 'assistant', content: display }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], taskContext }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) { upsert('Rate limited — please wait a moment.'); setLoading(false); return; }
        if (resp.status === 402) { upsert('AI credits depleted.'); setLoading(false); return; }
        throw new Error('Stream failed');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }

      // Execute any actions from the full response
      executeActions(assistantSoFar);
    } catch {
      upsert("Sorry, I couldn't connect. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-column-done text-primary-foreground shadow-lg glow-primary flex items-center justify-center hover:scale-105 transition-transform"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] glass-card flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-glass-border bg-gradient-to-r from-primary/10 to-column-done/10">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-display font-semibold text-sm">AI Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-column-completed/20 text-column-completed font-medium">can edit tasks</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm mt-12">
                  <Bot className="h-10 w-10 mx-auto mb-3 text-primary/40" />
                  <p className="mb-1">Ask me about your tasks!</p>
                  <p className="text-xs text-muted-foreground/60">I can also edit, move, or delete tasks for you.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-column-done/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] text-sm rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                      : 'bg-secondary/60 text-foreground'
                  }`}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {loading && !messages.some(m => m.role === 'assistant' && m === messages[messages.length - 1]) && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="bg-secondary/60 rounded-xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-glass-border">
              <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask or edit tasks..."
                  className="bg-secondary/50 border-glass-border text-sm"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0 bg-gradient-to-br from-primary to-column-done hover:opacity-90">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
