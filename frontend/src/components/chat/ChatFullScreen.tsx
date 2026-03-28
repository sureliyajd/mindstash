'use client';

import { X } from 'lucide-react';
import { useChatContext } from './ChatProvider';
import { ChatSidebar } from './ChatSidebar';

// =============================================================================
// CHAT FULL SCREEN (Mobile — overlay triggered by bottom tab bar)
// =============================================================================

export function ChatFullScreen() {
  const { setMobileChatOpen } = useChatContext();

  return (
    <div className="flex h-full flex-col">
      {/* Close bar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-2">
        <span className="text-sm font-semibold text-gray-700">AI Chat</span>
        <button
          onClick={() => setMobileChatOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatSidebar />
      </div>
    </div>
  );
}
