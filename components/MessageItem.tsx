
import React, { useState } from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, ExternalLink, Globe } from 'lucide-react';

interface MessageItemProps {
  message: Message;
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
    <div className="relative group my-4 rounded-xl overflow-hidden bg-zinc-900 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50">
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
          {className?.replace('language-', '') || 'code'}
        </span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-white/60 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar text-[15px] font-mono leading-relaxed text-zinc-300">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex w-full mb-8 justify-end animate-in slide-in-from-right-4 duration-300 px-2 md:px-0">
        <div className="max-w-[90%] md:max-w-[75%] px-4 py-3 rounded-2xl leading-relaxed text-[17px] bg-zinc-800/80 text-white rounded-tr-none shadow-sm border border-white/5">
          <div className="whitespace-pre-wrap">{message.text}</div>
          <div className="text-[10px] mt-2 opacity-40 uppercase tracking-widest text-right">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mb-12 justify-start pl-6 ml-2 md:ml-0 animate-in fade-in duration-500">
      
      {/* Imagem Carrossel */}
      {message.images && message.images.length > 0 && (
        <div className="mb-6 w-full max-w-full overflow-hidden">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory custom-scrollbar">
            {message.images.map((img, idx) => (
              <div key={idx} className="flex-shrink-0 w-[85%] md:w-[60%] snap-start">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900">
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
             <span className="text-[10px] text-white/30 uppercase tracking-widest">
               {message.images.length} {message.images.length === 1 ? 'Imagem Gerada' : 'Imagens Geradas'}
             </span>
          </div>
        </div>
      )}

      <div className="w-full prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h2 className="text-[22px] font-semibold text-white mt-6 mb-3 tracking-tight border-b border-white/5 pb-2">{children}</h2>,
            h2: ({ children }) => <h2 className="text-[20px] font-semibold text-white mt-6 mb-3 tracking-tight">{children}</h2>,
            p: ({ children }) => <p className="text-[17px] leading-relaxed text-gray-300 mb-4 font-normal">{children}</p>,
            code: ({ children, className, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;
              
              if (isInline) {
                return (
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-[14px] font-mono text-white/90" {...props}>
                    {children}
                  </code>
                );
              }
              
              return <CodeBlock className={className}>{children}</CodeBlock>;
            },
            ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-300">{children}</ul>,
            li: ({ children }) => <li className="text-[17px]">{children}</li>,
            hr: () => <hr className="border-white/10 my-6" />,
          }}
        >
          {message.text}
        </ReactMarkdown>

        {/* Fontes de Grounding (Google Search) */}
        {message.groundingUrls && message.groundingUrls.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Fontes e Referências</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingUrls.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-[11px] text-white/70 hover:text-white"
                >
                  <span className="max-w-[150px] truncate">{source.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="text-[10px] mt-6 opacity-30 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          chatArrow 5.2 • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
