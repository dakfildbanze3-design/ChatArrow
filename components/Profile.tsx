import React, { useState, useRef } from 'react';
import { X, User, Mail, Calendar, Shield, Camera, Loader2 } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseService';
import { useToast } from '../src/contexts/ToastContext';

interface ProfileProps {
  user: SupabaseUser;
  onClose: () => void;
  plan: string;
}

export const Profile: React.FC<ProfileProps> = ({ user, onClose, plan }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  
  const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email || user.user_metadata?.email}&background=333&color=fff`;
  const fullName = user.user_metadata?.full_name || (user.email || user.user_metadata?.email)?.split('@')[0] || 'Usuário';
  const email = user.email || user.user_metadata?.email || '';
  const joinDate = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const handleAvatarClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Compress image using canvas
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 200;
            const MAX_HEIGHT = 200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: compressedBase64 }
      });

      if (error) throw error;
      
      showToast('Foto de perfil atualizada!', 'success');
      
      // Force a reload to update the UI globally
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      showToast('Erro ao atualizar foto de perfil.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black text-white overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto p-6 md:p-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-bold tracking-tight">Perfil</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-12">
          <div 
            className="relative group cursor-pointer mb-6"
            onClick={handleAvatarClick}
          >
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 bg-zinc-900">
              {isUploading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              )}
            </div>
            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">{fullName}</h1>
          <p className="text-white/50">{email}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-6">Informações da Conta</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Nome Completo</p>
                  <p className="font-medium">{fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/50">E-mail</p>
                  <p className="font-medium">{email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Membro desde</p>
                  <p className="font-medium capitalize">{joinDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Plano Atual</p>
                  <p className="font-medium text-blue-400">{plan}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Status da Conta</p>
                  <p className="font-medium text-emerald-400">Ativa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
