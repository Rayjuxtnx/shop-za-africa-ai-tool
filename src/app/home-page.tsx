
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, LogIn, LogOut, MessageSquare, SendHorizonal, UserPlus, PlusCircle, RefreshCw, Info } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { getAiResponse } from '@/app/actions';
import { ChatMessage, ChatMessageLoading, type Message } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarMenuSkeleton, SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


type Session = {
  id: string;
  name: string;
};

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

const initialMessage: Message = {
  id: '0',
  role: 'assistant',
  content: 'am shop za africa ai assistant, how can i help you',
};

export default function HomePage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get('session');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleNewChat = () => {
    router.push('/');
  };

  const fetchSessions = useCallback(async () => {
      if (!user) return;
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sessions:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch your chat history.'
        });
      } else {
        setSessions(data as Session[]);
      }
      setIsLoadingHistory(false);
    }, [user, toast]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthChecked(true);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (_event === 'SIGNED_IN' && currentUser) {
            router.push('/');
            setMessages([initialMessage]);
        }
        if (_event === 'SIGNED_OUT') {
            setMessages([initialMessage]);
            setSessions([]);
            router.push('/');
        }
      }
    );

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Fetch sessions for logged in user
  useEffect(() => {
    if (user && authChecked) {
      fetchSessions();
    }
  }, [user, authChecked, fetchSessions]);

  // Fetch messages for active session
  useEffect(() => {
    const fetchMessages = async () => {
      if (user && activeSessionId) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', activeSessionId)
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
          setMessages(data.map(m => ({ id: String(m.id), role: m.role as 'user' | 'assistant', content: m.content })));
        }
      } else {
        setMessages([initialMessage]);
      }
    };
    if (authChecked) {
        fetchMessages();
    }
  }, [user, activeSessionId, toast, authChecked]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userInput = values.message;
    
    const optimisticUserMessage: Message = { 
        id: String(Date.now()), 
        role: 'user', 
        content: userInput 
    };

    const currentMessages = messages[0]?.id === '0' ? [] : messages;
    const history = currentMessages.map(({ role, content }) => ({ role: role as 'user' | 'assistant', content }));
    let newMessages = [...currentMessages, optimisticUserMessage];
    setMessages(newMessages);
    
    setIsLoading(true);
    form.reset();

    let currentSessionId = activeSessionId;

    if (user) {
        if (!currentSessionId) {
            const sessionName = userInput.substring(0, 25) + (userInput.length > 25 ? '...' : '');
            const { data, error } = await supabase
                .from('sessions')
                .insert({ user_id: user.id, name: sessionName })
                .select('id, name')
                .single();

            if (error) {
                console.error('Error creating session', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not start a new chat session.' });
                setIsLoading(false);
                setMessages(currentMessages); // Rollback optimistic update
                return;
            }
            currentSessionId = data.id;
            setSessions(prev => [data as Session, ...prev]);
            router.push(`/?session=${data.id}`, { scroll: false });
            newMessages = [optimisticUserMessage]; // Start new chat view
            setMessages(newMessages);
        }

        const { error: messageError } = await supabase
            .from('messages')
            .insert({ 
                role: 'user', 
                content: userInput, 
                user_id: user.id,
                session_id: currentSessionId,
            });

        if (messageError) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'Failed to save your message.',
            });
            setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
            setIsLoading(false);
            return;
        }
    }
    
    const result = await getAiResponse({ history, question: userInput });
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.error,
      });
       setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id));
    } else {
        const assistantMessageContent = result.data!;
        const newAssistantMessage: Message = {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: assistantMessageContent
        };
        
        if (user && currentSessionId) {
            const { error } = await supabase
                .from('messages')
                .insert({ 
                    role: 'assistant', 
                    content: assistantMessageContent, 
                    user_id: user.id,
                    session_id: currentSessionId,
                });

            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Uh oh! Something went wrong.',
                    description: 'Failed to save the AI response.',
                });
            }
        }
        
        setMessages(prev => [...prev, newAssistantMessage]);
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
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="w-full" onClick={handleNewChat}>
                        <PlusCircle className="mr-2" />
                        New Chat
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchSessions} disabled={isLoadingHistory} aria-label="Refresh history">
                        <RefreshCw className={cn("h-4 w-4", isLoadingHistory && "animate-spin")} />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarMenu>
                    {isLoadingHistory ? (
                        <>
                            <SidebarMenuSkeleton showIcon />
                            <SidebarMenuSkeleton showIcon />
                            <SidebarMenuSkeleton showIcon />
                        </>
                    ) : (
                        sessions.map(session => (
                            <SidebarMenuItem key={session.id}>
                                <Link href={`/?session=${session.id}`}>
                                    <SidebarMenuButton
                                        isActive={activeSessionId === session.id}
                                        className="w-full justify-start"
                                    >
                                        <MessageSquare />
                                        <span>{session.name}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))
                    )}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <p className="text-xs text-muted-foreground text-center">Your chat history</p>
            </SidebarFooter>
        </Sidebar>
      <SidebarInset className="flex h-screen flex-col bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-4 bg-card/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {user && <SidebarTrigger />}
            <div className="p-2 bg-primary/10 rounded-full">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Philip Virtual Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
             <Dialog>
                <DialogTrigger asChild>
                   <Button variant="ghost" size="icon" aria-label="About us">
                      <Info className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>About Philip Virtual Assistant</DialogTitle>
                    <DialogDescription>
                      This is an AI-powered chat application built by Philip Otieno. 
                      You can ask it questions, have it summarize text, or even ask it to write a story. 
                      Your conversations are private and secure. 
                      Log in to save and view your chat history.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              {user ? (
                  <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                      <LogOut className="h-5 w-5" />
                  </Button>
              ) : (
                  <>
                      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                          <Link href="/login">
                              <LogIn className="mr-2 h-4 w-4" />
                              Login
                          </Link>
                      </Button>
                      <Button asChild size="sm" className="hidden sm:inline-flex">
                          <Link href="/signup">
                              <UserPlus className="mr-2 h-4 w-4" />
                              Sign Up
                          </Link>
                      </Button>
                       <Button asChild variant="ghost" size="icon" className="sm:hidden">
                          <Link href="/login">
                              <LogIn className="h-5 w-5" />
                          </Link>
                      </Button>
                      <Button asChild size="icon" className="sm:hidden">
                          <Link href="/signup">
                              <UserPlus className="h-5 w-5" />
                          </Link>
                      </Button>
                  </>
              )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl space-y-8 pb-32">
            {!user && authChecked && (
              <div className="rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>{' '}
                to track your history.
              </div>
            )}
            {messages.map(m => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {isLoading && <ChatMessageLoading />}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <footer className="fixed bottom-0 right-0 border-t border-border/50 bg-card/20 p-2 backdrop-blur-sm md:p-4 w-full md:w-[calc(100%_-_var(--sidebar-width))] transition-[width] duration-200 ease-linear group-data-[collapsible=icon]/sidebar-wrapper:md:w-[calc(100%_-_var(--sidebar-width-icon))] group-data-[collapsible=offcanvas]/sidebar-wrapper:md:w-full">
          <div className="mx-auto max-w-3xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-start gap-2 md:gap-4"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Ask me anything..."
                          className="resize-none rounded-2xl border-2 border-border bg-card/50 focus-visible:ring-primary/50"
                          {...field}
                          disabled={isLoading}
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
             <div className="mt-2 text-center text-xs text-muted-foreground">
              <p>Created by Philip Otieno.</p>
              <p>This message is encrypted. No other person can see your chats.</p>
              <p>Avoid asking violating questions.</p>
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

    

    