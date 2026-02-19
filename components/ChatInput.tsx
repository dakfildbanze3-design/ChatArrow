
import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Removido o auto-resize para manter a altura fixa de 50px conforme solicitado
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  }, [text]);

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-black via-black/95 to-transparent">
      <div className="max-w-4xl mx-auto relative group">
        {/* Efeito de borda gradiente rosa/amarelo no foco */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-pink-500 to-yellow-400 rounded-[25px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-[1px]"></div>
        
        <div className="relative flex items-center gap-3 bg-zinc-900 rounded-[24px] px-4 h-[50px] transition-all shadow-lg">
          <button className="p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <PlusCircle className="w-6 h-6" strokeWidth={1.2} />
          </button>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Esteja à vontade ..."
            disabled={disabled}
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-0 resize-none h-[24px] text-[15px] self-center leading-6 custom-scrollbar"
          />

          <button 
            onClick={() => handleSubmit()}
            disabled={!text.trim() || disabled}
            className={`p-1.5 rounded-full transition-all flex-shrink-0 ${
              text.trim() && !disabled 
                ? 'text-white' 
                : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <SendHorizontal className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
