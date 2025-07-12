import React from 'react';
import { cn, formatTimestamp } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { Bot, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 max-w-full', className)}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary' : 'bg-secondary'
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn(
          'rounded-lg p-4 max-w-full',
          isUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        )}>
          <div className="prose prose-sm max-w-none">
            {isUser ? (
              <p className="mb-0">{message.content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4 list-decimal">{children}</ol>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>

          {message.sources && message.sources.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{message.sources.length} source{message.sources.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                View sources
              </summary>
              <div className="mt-2 space-y-2">
                {message.sources.map((source) => (
                  <div key={source.id} className="bg-muted/50 p-2 rounded text-xs">
                    <p className="font-medium">{source.metadata.filename}</p>
                    <p className="text-muted-foreground truncate">{source.content}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
