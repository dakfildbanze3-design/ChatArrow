import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { X, Mail, Github, Chrome, User, Upload, ArrowRight, Camera } from 'lucide-react';

interface AuthProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setAvatarFile(null);
      setAvatarPreview('');
      return;
    }
    const file = e.target.files[0];
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let uploadedAvatarUrl = '';

      // Upload avatar if selected (only for registration or if user wants to update)
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          uploadedAvatarUrl = data.publicUrl;
        }
      }

      // Use signInAnonymously to bypass email verification and password
      // We store the user info in metadata to simulate a profile
      const { error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: name || email.split('@')[0],
            avatar_url: uploadedAvatarUrl,
            email: email, // Store email in metadata since it's anonymous
          }
        }
      });

      if (error) throw error;
      
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden border border-zinc-900">
        <div className="p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-10 p-2 hover:bg-white/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center mb-8">
            {!isLogin ? (
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload-top"
                />
                <label 
                  htmlFor="avatar-upload-top"
                  className="block w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-zinc-900 hover:border-zinc-800 transition-all bg-zinc-800/50 relative group-hover:scale-105 duration-300"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                      <Camera className="w-8 h-8 mb-1" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </label>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-800/50 border border-zinc-900 flex items-center justify-center mb-2 shadow-inner">
                <User className="w-10 h-10 text-zinc-600" />
              </div>
            )}
            
            <h2 className="text-3xl font-bold text-white mt-6 tracking-tight">
              {isLogin ? 'Bem-vindo' : 'Criar Conta'}
            </h2>
            <p className="text-zinc-500 text-sm mt-2 font-medium">
              {isLogin ? 'Acesse sua conta para continuar' : 'Junte-se a nós hoje mesmo'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-white placeholder:text-zinc-600"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-white placeholder:text-zinc-600"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="my-8 flex justify-center">
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">Ou continue com</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-3 py-3.5 px-4 bg-zinc-800/50 border border-zinc-900 rounded-2xl hover:bg-zinc-800 hover:border-zinc-800 transition-all text-white text-sm font-bold shadow-sm"
            >
              <Chrome className="w-4 h-4" />
              Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-3 py-3.5 px-4 bg-zinc-800/50 border border-zinc-900 rounded-2xl hover:bg-zinc-800 hover:border-zinc-800 transition-all text-white text-sm font-bold shadow-sm"
            >
              <Github className="w-4 h-4" />
              Github
            </button>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-zinc-500 hover:text-white transition-colors font-medium"
            >
              {isLogin ? 'Não tem uma conta? ' : 'Já possui conta? '}
              <span className="text-white font-bold underline underline-offset-4 decoration-zinc-700 hover:decoration-white transition-all">
                {isLogin ? 'Cadastre-se' : 'Entre agora'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
