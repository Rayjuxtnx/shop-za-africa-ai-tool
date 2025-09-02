'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, LogIn, LogOut, SendHorizonal, UserPlus } from 'lucide-react';
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
import Link from 'next/link';

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
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
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
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthChecked(true);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (_event === 'SIGNED_IN') {
            // On sign-in, clear guest messages and fetch user's history
            setMessages([]);
        }
        if (_event === 'SIGNED_OUT') {
            // On sign-out, revert to initial guest state
            setMessages([initialMessage]);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const fetchMessages = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        setIsLoading(false);

        if (error) {
          console.error('Error fetching messages:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch your chat history.'
          });
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
    } else {
        // Guest user, reset to initial message if needed
        if(messages.length === 0 || (messages.length > 0 && messages[0].id !== '0')) {
            setMessages([initialMessage]);
        }
    }
  }, [user, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Go to home page as guest
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userInput = values.message;
    const optimisticUserMessage: Message = { 
        id: String(Date.now()), 
        role: 'user', 
        content: userInput 
    };

    const newMessages = messages[0]?.id === '0' ? [] : messages;
    setMessages(prev => [...newMessages, optimisticUserMessage]);
    
    setIsLoading(true);
    form.reset();

    const { error: userMessageError } = await supabase
        .from('messages')
        .insert({ role: 'user', content: userInput, user_id: user?.id });

    if (userMessageError) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'Failed to save your message.',
        });
        // Revert optimistic update
        setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
        setIsLoading(false);
        return;
    }

    const result = await getAiResponse(userInput);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.error,
      });
       // Revert optimistic update
       setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
    } else {
        const assistantMessageContent = result.data!;
        const assistantMessage: Message = {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: assistantMessageContent
        };
        
         const { error: assistantMessageError } = await supabase
            .from('messages')
            .insert({ role: 'assistant', content: assistantMessageContent, user_id: user?.id });

        if (assistantMessageError) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'Failed to save the AI response.',
            });
        }

        // We only want to add the assistant message if the optimistic user message is still there
        setMessages(prev => prev.find(m => m.id === optimisticUserMessage.id) ? [...prev.filter(m => m.id !== optimisticUserMessage.id), { ...optimisticUserMessage, id: String(Date.now()) }, assistantMessage] : [...prev, assistantMessage]);
    }
    
    setIsLoading(false);
  }
  
  if (!authChecked) {
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
        <div className="flex items-center gap-2">
            {user ? (
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                    <LogOut className="h-5 w-5" />
                </Button>
            ) : (
                <>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/login">
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                        </Link>
                    </Button>
                    <Button asChild size="sm">
                        <Link href="/signup">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign Up
                        </Link>
                    </Button>
                </>
            )}
        </div>
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
