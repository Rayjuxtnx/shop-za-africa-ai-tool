'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        'flex items-start gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg p-3 text-sm shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
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
        <div className="flex items-start gap-3 justify-start">
            <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <div className="bg-card max-w-[80%] rounded-lg p-3 text-sm shadow-sm">
                <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                </div>
            </div>
        </div>
    )
}
