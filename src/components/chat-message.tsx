'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={cn(
        'flex items-start gap-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl p-4 text-sm shadow-md',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-foreground rounded-bl-none'
        )}
      >
        <p className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
          {message.content}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-9 w-9 border-2 border-border">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function ChatMessageLoading() {
    return (
        <div className="flex items-start gap-4 justify-start">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <div className="bg-card max-w-[80%] rounded-2xl p-4 text-sm shadow-md rounded-bl-none">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full bg-primary/50" />
                    <Skeleton className="h-3 w-3 rounded-full bg-primary/50" />
                    <Skeleton className="h-3 w-3 rounded-full bg-primary/50" />
                </div>
            </div>
        </div>
    )
}
