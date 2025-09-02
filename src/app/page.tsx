'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SendHorizonal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getAiResponse } from '@/app/actions';
import { ChatMessage, ChatMessageLoading, type Message } from '@/components/chat-message';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi, I’m your AI assistant. How can I help you?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    scrollToBottom();
  }, [messages]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userInput = values.message;
    
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: userInput },
    ]);
    setIsLoading(true);
    form.reset();

    const result = await getAiResponse(userInput);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: result.error,
      });
      setMessages(prev => prev.slice(0, -1)); // Remove the user message if the call fails
    } else {
        setMessages(prev => [
            ...prev,
            { id: crypto.randomUUID(), role: 'assistant', content: result.data! },
        ]);
    }
    
    setIsLoading(false);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-center border-b px-4">
        <div className="flex items-center gap-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">AetherChat</h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map(m => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isLoading && <ChatMessageLoading />}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="border-t bg-card p-4">
        <div className="mx-auto max-w-2xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-start gap-2"
            >
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder="What's 7 x 12?"
                        className="resize-none"
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
              <Button type="submit" size="icon" disabled={isLoading}>
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
