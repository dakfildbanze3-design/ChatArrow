
import React, { useState } from 'react';
import { Message, AppSettings } from '../types';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, ExternalLink, Globe, Cpu, Zap, Activity, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  settings?: AppSettings;
}

const CodeBlock = ({ children, className }: { children?: any; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children || '').replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-sm dark:shadow-lg border border-zinc-200 dark:border-transparent">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-200/50 dark:bg-zinc-800/50">
        <span className="text-[10px] text-zinc-500 dark:text-white/40 font-mono uppercase tracking-widest">
          {className?.replace('language-', '') || 'code'}
        </span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar text-[15px] font-mono leading-relaxed text-zinc-700 dark:text-zinc-300">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({ message, settings }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(prev => prev === type ? null : type);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full mb-8 animate-in slide-in-from-right-4 duration-300 px-2 md:px-0 group/msg">
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 justify-end max-w-[90%] md:max-w-[75%]">
            {message.images.map((img, idx) => (
              <div key={idx} className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img src={img} alt="User upload" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="max-w-[90%] md:max-w-[75%] px-4 py-3 rounded-2xl leading-relaxed text-[19px] bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-tr-none shadow-sm border border-zinc-200 dark:border-white/5">
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <button 
            onClick={handleCopyMessage}
            className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-zinc-400 dark:text-white/30 uppercase tracking-widest hover:text-zinc-600 dark:hover:text-white/60"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <div className="text-[10px] opacity-40 uppercase tracking-widest text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  const textParts = message.text.split('|||IMAGES_PLACEHOLDER|||');

  const renderCarousel = () => (
    <div className="my-8 w-full max-w-full overflow-hidden">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory custom-scrollbar">
        {message.images?.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-[85%] md:w-[60%] snap-start">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-xl bg-zinc-100 dark:bg-zinc-900">
              <img 
                src={img} 
                alt={`Generated ${idx}`} 
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" 
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
         <span className="text-[10px] text-zinc-400 dark:text-white/30 uppercase tracking-widest">
           {message.images?.length} {message.images?.length === 1 ? 'Imagem Gerada' : 'Imagens Geradas'}
         </span>
      </div>
    </div>
  );

  const markdownComponents = {
    h1: ({ children }: any) => <h2 className="text-[28px] font-bold text-zinc-900 dark:text-white mt-10 mb-6 tracking-tight">{children}</h2>,
    h2: ({ children }: any) => {
      // Tenta detectar se o título começa com um número para estilizar como no ChatGPT
      const content = String(children);
      const hasNumber = /^\d+/.test(content);
      
      return (
        <h2 className="text-[24px] font-bold text-zinc-900 dark:text-white mt-10 mb-6 tracking-tight flex items-center gap-3">
          {hasNumber && (
            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white text-[14px] flex items-center justify-center rounded-md font-bold">
              {content.match(/^\d+/)?.[0]}
            </span>
          )}
          <span>{hasNumber ? content.replace(/^\d+\.?\s*/, '') : children}</span>
        </h2>
      );
    },
    p: ({ children }: any) => <p className="text-[18px] leading-[1.6] text-zinc-700 dark:text-zinc-300 mb-6 font-normal">{children}</p>,
    code: ({ children, className, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      
      if (isInline) {
        return (
          <code className="bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[14px] font-mono text-zinc-900 dark:text-white/90" {...props}>
            {children}
          </code>
        );
      }
      
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    ul: ({ children }: any) => <ul className="list-none pl-2 space-y-3 mb-8 text-zinc-700 dark:text-zinc-300">{children}</ul>,
    li: ({ children }: any) => (
      <li className="text-[18px] flex items-start gap-3">
        <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
        <span>{children}</span>
      </li>
    ),
    hr: () => <hr className="border-zinc-200 dark:border-white/10 my-10" />,
  };

  return (
    <div className="flex flex-col w-full mb-12 justify-start animate-in fade-in duration-500 group/msg">
      
      <div className={`w-full prose max-w-none ${settings?.appearance.theme === 'Claro' ? 'prose-zinc' : 'prose-invert'}`}>
        <ReactMarkdown components={markdownComponents}>
          {textParts[0]}
        </ReactMarkdown>

        {message.images && message.images.length > 0 && renderCarousel()}

        {textParts[1] && (
          <ReactMarkdown components={markdownComponents}>
            {textParts[1]}
          </ReactMarkdown>
        )}

        {/* Fontes de Grounding (Google Search) */}
        {message.groundingUrls && message.groundingUrls.length > 0 && (
          <div className="mt-8 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-zinc-400 dark:text-white/40" />
              <span className="text-[10px] text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] font-medium">Fontes e Referências</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingUrls.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all text-[11px] text-zinc-600 dark:text-white/70 hover:text-white"
                >
                  <span className="max-w-[150px] truncate">{source.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Info (Modo Avançado) */}
        {!isUser && settings?.advanced && (
          <div className="mt-6 flex flex-wrap gap-4 pt-4">
            {settings.advanced.showModel && message.model && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-white/30 uppercase tracking-widest">
                <Cpu className="w-3 h-3" />
                <span>{message.model}</span>
              </div>
            )}
            {settings.advanced.showTokens && message.usage && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-white/30 uppercase tracking-widest">
                <Zap className="w-3 h-3" />
                <span>{message.usage.totalTokenCount} tokens</span>
              </div>
            )}
            {settings.advanced.showTime && message.responseTime && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-white/30 uppercase tracking-widest">
                <Activity className="w-3 h-3" />
                <span>{(message.responseTime / 1000).toFixed(2)}s</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
              <button 
                onClick={() => handleFeedback('up')}
                className={`p-1.5 rounded-md transition-all ${feedback === 'up' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-400 hover:text-zinc-600 dark:text-white/30 dark:hover:text-white/60'}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleFeedback('down')}
                className={`p-1.5 rounded-md transition-all ${feedback === 'down' ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-zinc-600 dark:text-white/30 dark:hover:text-white/60'}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button 
            onClick={handleCopyMessage}
            className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-zinc-400 dark:text-white/30 uppercase tracking-widest hover:text-zinc-600 dark:hover:text-white/60"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
};
