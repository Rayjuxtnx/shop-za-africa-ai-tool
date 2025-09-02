'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SendHorizonal, Bot, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { getAiResponse } from '@/app/actions';
import { ChatMessage, ChatMessageLoading, type Message } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

const initialMessage: Message = {
  id: '0',
  role: 'assistant',
  content: 'am shop za africa ai assistant, how can i help you',
};

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          setMessages([initialMessage]);
        } else {
          if (data.length === 0) {
            setMessages([initialMessage]);
          } else {
            setMessages(data.map(m => ({ id: String(m.id), role: m.role as 'user' | 'assistant', content: m.content })));
          }
        }
      };
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to send a message.',
        });
        return;
    }

    const userInput = values.message;
    const userMessage: Omit<Message, 'id'> & { user_id: string } = { role: 'user', content: userInput, user_id: user.id };

    const tempId = String(Date.now());
    const optimisticUserMessage = { ...userMessage, id: tempId };
    const newMessages = messages.filter(m => m.id !== '0');
    setMessages(prev => [...newMessages, optimisticUserMessage]);

    setIsLoading(true);
    form.reset();

    const { data: userMessageData, error: userMessageError } = await supabase.from('messages').insert(userMessage).select().single();
    
    if (userMessageError) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Failed to save your message.',
      });
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setIsLoading(false);
      return;
    }

    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: String(userMessageData.id) } : m));

    const result = await getAiResponse(userInput);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.error,
      });
      await supabase.from('messages').delete().eq('id', userMessageData.id);
      setMessages(prev => prev.filter(m => m.id !== String(userMessageData.id)));
    } else {
        const assistantMessage: Omit<Message, 'id'> & { user_id: string } = { role: 'assistant', content: result.data!, user_id: user.id };
        const { data: assistantMessageData, error: assistantMessageError } = await supabase.from('messages').insert(assistantMessage).select().single();

        if (assistantMessageError) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'Failed to save the AI response.',
            });
        } else {
            setMessages(prev => [
                ...prev,
                { ...assistantMessage, id: String(assistantMessageData.id) },
            ]);
        }
    }
    
    setIsLoading(false);
  }
  
  if (!user) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-background">
            <ChatMessageLoading />
        </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-4 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Philip Assistant</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {messages.map(m => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isLoading && <ChatMessageLoading />}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="border-t border-border/50 bg-card/20 p-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-start gap-4"
            >
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder="What's 7 x 12?"
                        className="resize-none rounded-2xl border-2 border-border bg-card/50 focus-visible:ring-primary/50"
                        {...field}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if(field.value.trim()){
                                form.handleSubmit(onSubmit)();
                            }
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" size="icon" disabled={isLoading} className="rounded-full h-12 w-12 shrink-0">
                <SendHorizonal className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </Form>
        </div>
      </footer>
    </div>
  );
}
