
import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, SendHorizontal, FileText, Image, Camera, X, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, images?: string[]) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((text.trim() || selectedImages.length > 0) && !disabled) {
      onSendMessage(text.trim(), selectedImages);
      setText('');
      setSelectedImages([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        reader.onloadend = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/json' || file.name.endsWith('.json') || file.type.startsWith('text/')) {
        reader.onloadend = () => {
          const content = reader.result as string;
          setText(prev => {
            const separator = prev.trim() ? '\n\n' : '';
            return prev + separator + `Conteúdo do arquivo (${file.name}):\n\`\`\`${file.name.endsWith('.json') ? 'json' : ''}\n${content}\n\`\`\``;
          });
        };
        reader.readAsText(file);
      }
    });
    setIsMenuOpen(false);
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize logic for up to 4 lines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24;
      const maxHeight = lineHeight * 4;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [text]);

  const menuOptions = [
    { 
      icon: <FileText className="w-4 h-4" />, 
      label: 'Documento', 
      color: 'text-blue-400',
      onClick: () => fileInputRef.current?.click()
    },
    { 
      icon: <Image className="w-4 h-4" />, 
      label: 'Fotos e Vídeos', 
      color: 'text-purple-400',
      onClick: () => {
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*,video/*';
          fileInputRef.current.click();
        }
      }
    },
    { 
      icon: <Camera className="w-4 h-4" />, 
      label: 'Câmera', 
      color: 'text-pink-400',
      onClick: () => {
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*';
          fileInputRef.current.capture = 'environment';
          fileInputRef.current.click();
        }
      }
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-black dark:via-black/95 dark:to-transparent transition-colors duration-300">
      <div className="max-w-4xl mx-auto relative group">
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />

        {/* Upload Menu Popup */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50 min-w-[180px]"
          >
            <div className="flex flex-col gap-1">
              {menuOptions.map((option, idx) => (
                <button
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-left group/item"
                  onClick={option.onClick}
                >
                  <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-white/5 ${option.color} group-hover/item:bg-zinc-200 dark:group-hover/item:bg-white/10 transition-colors`}>
                    {option.icon}
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-gray-300 group-hover/item:text-zinc-900 dark:group-hover/item:text-white transition-colors">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col bg-zinc-100 dark:bg-zinc-900 rounded-[24px] transition-all shadow-lg border border-zinc-200 dark:border-transparent overflow-hidden">
          {/* Selected Images Preview - Now Inside */}
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-1 animate-in fade-in slide-in-from-bottom-2">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative w-14 h-14 group/img">
                  <img src={img} className="w-full h-full object-cover rounded-xl border border-zinc-200 dark:border-white/10" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-[3px] px-4 py-3 min-h-[50px]">
            <button 
              className="p-2 mb-0.5 rounded-full bg-gradient-to-tr from-zinc-400 to-zinc-600 dark:from-zinc-700 dark:to-zinc-900 text-white shadow-sm hover:opacity-90 transition-all flex-shrink-0"
              title="Voz"
            >
              <Mic className="w-[23px] h-[23px]" />
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 mb-0.5 rounded-full bg-gradient-to-tr from-zinc-400 to-zinc-600 dark:from-zinc-700 dark:to-zinc-900 text-white shadow-sm hover:opacity-90 transition-all flex-shrink-0 ${isMenuOpen ? 'rotate-45' : ''}`}
            >
              <PlusCircle className="w-[23px] h-[23px]" />
            </button>
            
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Esteja à vontade ..."
              disabled={disabled}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-gray-500 py-0 resize-none min-h-[24px] text-[15px] leading-6 custom-scrollbar mb-2"
            />

            <button 
              onClick={() => handleSubmit()}
              disabled={(!text.trim() && selectedImages.length === 0) || disabled}
              className={`p-2 mb-0.5 rounded-full shadow-sm transition-all flex-shrink-0 ${
                (text.trim() || selectedImages.length > 0) && !disabled 
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:opacity-90' 
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <SendHorizontal className="w-[23px] h-[23px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
