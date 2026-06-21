import { ReactNode } from 'react';
import ChatbotWidget from '@/components/ChatbotWidget';

export default function CollabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <ChatbotWidget audience="collab" />
    </div>
  );
}
