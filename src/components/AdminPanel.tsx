import React, { useState, useRef, useEffect } from 'react';
import { useGalleryCategories } from '../data/galleryStore';
import { signInAdmin, signOutAdmin, isLocalAdminSessionActive } from '../lib/supabase';
import { X, Upload, Trash2, ArrowUp, ArrowDown, Plus, Check, Lock, LogOut, KeyRound } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { categories, isSupabaseConnected, addCategory, removeCategory, reorderCategory, clearAll } = useGalleryCategories();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isLocalAdminSessionActive());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Upload state
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleSessionChange = () => {
      setIsAuthenticated(isLocalAdminSessionActive());
    };
    window.addEventListener('admin-session-changed', handleSessionChange);
    return () => window.removeEventListener('admin-session-changed', handleSessionChange);
  }, []);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    const res = await signInAdmin(email, password);
    setIsLoggingIn(false);

    if (res.success) {
      setIsAuthenticated(true);
      showNotice('Authenticated. Welcome to Admin Control.');
    } else {
      setAuthError(res.error || 'Invalid login credentials');
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (isSupabaseConnected) {
        showNotice(`Uploading "${file.name}" to storage...`);
        await addCategory('', file.name.replace(/\.[^/.]+$/, ''), file);
        showNotice(`Uploaded "${file.name}" successfully!`);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (base64) {
            addCategory(base64, file.name.replace(/\.[^/.]+$/, ''));
            showNotice(`Saved "${file.name}" locally`);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity animate-gallery-fade cursor-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-[#080808] border border-neutral-800 rounded-xs p-6 md:p-8 shadow-2xl text-neutral-300 font-sans space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-neutral-400" />
                <h2 className="text-xl md:text-2xl font-serif-display text-neutral-100 italic tracking-wide">
                  Exhibition Administration
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-mono-code text-neutral-500 uppercase tracking-widest">
              Please enter your administrator credentials to access image management.
            </p>

            {authError && (
              <div className="px-3 py-2 bg-red-950/40 border border-red-900/60 text-red-300 text-xs font-mono-code rounded-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono-code text-neutral-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@obscura.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 text-xs font-mono-code text-white rounded-xs focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono-code text-neutral-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-800 text-xs font-mono-code text-white rounded-xs focus:outline-none focus:border-neutral-500 transition-colors font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-neutral-200 hover:bg-white text-black text-xs font-mono-code uppercase font-semibold rounded-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isLoggingIn ? 'AUTHENTICATING...' : 'SIGN IN & ACTIVATE SESSION'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN PANEL */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-serif-display text-neutral-100 italic tracking-wide">
                    Exhibition Management
                  </h2>
                  <span className="text-[10px] font-mono-code text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                    SESSION ACTIVE
                  </span>
                </div>
                <p className="text-xs font-mono-code text-neutral-500 mt-1 uppercase tracking-wider">
                  Upload & Reorder Carousel Images
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white transition-colors border border-neutral-800 rounded-xs"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice Toast */}
            {notification && (
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-mono-code rounded-xs">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{notification}</span>
              </div>
            )}

            {/* Local PC File Upload Section */}
            <div className="space-y-3 bg-neutral-950/60 p-4 border border-neutral-900 rounded-xs">
              <span className="text-xs font-mono-code text-neutral-300 uppercase tracking-wider flex items-center gap-2 font-medium">
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                Upload Images from Your Computer
              </span>

              <div className="space-y-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="admin-file-upload-pc"
                />
                <label
                  htmlFor="admin-file-upload-pc"
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-800 hover:border-neutral-500 rounded-xs cursor-pointer bg-neutral-900/30 hover:bg-neutral-900/60 transition-all text-center group"
                >
                  <Plus className="w-6 h-6 text-neutral-500 group-hover:text-white mb-2 transition-colors" />
                  <span className="text-xs font-mono-code text-neutral-200 font-medium">
                    Click to select image files from your computer
                  </span>
                  <span className="text-[10px] font-mono-code text-neutral-500 mt-1">
                    Supports JPG, PNG, WebP, GIF, SVG
                  </span>
                </label>
              </div>
            </div>

            {/* Carousel Item Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-code uppercase text-neutral-400 tracking-wider">
                  Active Carousel Items ({categories.length})
                </span>
                {categories.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[11px] font-mono-code text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All Images</span>
                  </button>
                )}
              </div>

              {categories.length === 0 ? (
                <div className="p-6 bg-neutral-950/40 border border-neutral-900 rounded-xs text-center text-xs font-mono-code text-neutral-600 uppercase tracking-widest">
                  No images in gallery. Upload image files above.
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 bg-neutral-900/50 border border-neutral-800/80 rounded-xs hover:border-neutral-700 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono-code text-neutral-500 min-w-[24px]">
                          {cat.number}
                        </span>
                        <div className="w-12 h-12 bg-black border border-neutral-800 rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={cat.imagePath}
                            alt={cat.altText || ''}
                            className="w-full h-full object-cover filter grayscale"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-mono-code text-neutral-300 truncate">
                            {cat.altText || `Image ${cat.number}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => reorderCategory(idx, idx - 1)}
                          className="p-1.5 text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                          aria-label="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={idx === categories.length - 1}
                          onClick={() => reorderCategory(idx, idx + 1)}
                          className="p-1.5 text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                          aria-label="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeCategory(cat.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Exit Session */}
            <div className="border-t border-neutral-800 pt-4 flex items-center justify-between">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-mono-code text-neutral-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit & Lock Session</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-mono-code tracking-widest text-black bg-neutral-200 hover:bg-white transition-colors rounded-xs uppercase font-semibold focus:outline-none"
              >
                Return to Exhibition
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
