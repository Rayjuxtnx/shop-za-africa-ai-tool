
import { Suspense } from 'react';
import { ChatMessageLoading } from '@/components/chat-message';
import HomePage from './home-page';

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-background"><ChatMessageLoading /></div>}>
      <HomePage />
    </Suspense>
  );
}
