import { useState, useEffect, useCallback } from 'react';
import { GalleryCategory } from './galleryData';
import { getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY = 'obscura_gallery_items_v1';

export function getStoredCategories(): GalleryCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load gallery items from storage:', e);
  }
  return [];
}

export function saveCategoriesToStorage(items: GalleryCategory[]): void {
  try {
    const indexed = items.map((item, idx) => ({
      ...item,
      number: String(idx + 1).padStart(2, '0')
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(indexed));
    window.dispatchEvent(new Event('gallery-storage-updated'));
  } catch (e) {
    console.error('Failed to save gallery items to storage:', e);
  }
}

export function useGalleryCategories() {
  const [categories, setCategories] = useState<GalleryCategory[]>(getStoredCategories);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync Supabase status & items
  const checkSupabaseStatus = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSupabaseConnected(false);
      setCategories(getStoredCategories());
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await client
        .from('gallery_items')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        console.warn('Supabase query notice:', error.message);
        setIsSupabaseConnected(false);
        setCategories(getStoredCategories());
      } else if (data) {
        setIsSupabaseConnected(true);
        const mapped: GalleryCategory[] = data.map((item, idx) => ({
          id: String(item.id),
          number: String(idx + 1).padStart(2, '0'),
          imagePath: item.image_url,
          altText: item.alt_text || `Gallery image ${idx + 1}`
        }));
        setCategories(mapped);
        saveCategoriesToStorage(mapped);
      }
    } catch (e) {
      console.error('Supabase connection check error:', e);
      setIsSupabaseConnected(false);
      setCategories(getStoredCategories());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSupabaseStatus();

    const handleLocalUpdate = () => {
      if (!getSupabaseClient()) {
        setCategories(getStoredCategories());
      }
    };

    window.addEventListener('gallery-storage-updated', handleLocalUpdate);
    window.addEventListener('supabase-config-updated', checkSupabaseStatus);
    window.addEventListener('storage', handleLocalUpdate);

    return () => {
      window.removeEventListener('gallery-storage-updated', handleLocalUpdate);
      window.removeEventListener('supabase-config-updated', checkSupabaseStatus);
      window.removeEventListener('storage', handleLocalUpdate);
    };
  }, [checkSupabaseStatus]);

  // Upload file directly to Supabase storage bucket "gallery-images"
  const uploadFileToSupabase = async (file: File): Promise<string | null> => {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('gallery-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file to Supabase Storage:', uploadError);
        return null;
      }

      const { data } = client.storage
        .from('gallery-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (e) {
      console.error('Failed to upload file to Supabase:', e);
      return null;
    }
  };

  const addCategory = async (imagePath: string, altText?: string, file?: File) => {
    let finalImagePath = imagePath;
    const client = getSupabaseClient();

    if (client && file) {
      const uploadedUrl = await uploadFileToSupabase(file);
      if (uploadedUrl) {
        finalImagePath = uploadedUrl;
      }
    }

    if (client) {
      try {
        const nextPos = categories.length + 1;
        const { data, error } = await client
          .from('gallery_items')
          .insert([
            {
              image_url: finalImagePath,
              alt_text: altText || `Gallery image ${nextPos}`,
              position: nextPos
            }
          ])
          .select();

        if (!error && data) {
          checkSupabaseStatus();
          return;
        }
      } catch (e) {
        console.error('Error adding item to Supabase table:', e);
      }
    }

    // Fallback to local storage
    const current = getStoredCategories();
    const newItem: GalleryCategory = {
      id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      number: String(current.length + 1).padStart(2, '0'),
      imagePath: finalImagePath,
      altText: altText || `Gallery image ${current.length + 1}`
    };
    const updated = [...current, newItem];
    saveCategoriesToStorage(updated);
    setCategories(getStoredCategories());
  };

  const removeCategory = async (id: string) => {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from('gallery_items')
          .delete()
          .eq('id', id);

        if (!error) {
          checkSupabaseStatus();
          return;
        }
      } catch (e) {
        console.error('Error deleting item from Supabase:', e);
      }
    }

    // Fallback local storage
    const current = getStoredCategories();
    const updated = current.filter((item) => item.id !== id);
    saveCategoriesToStorage(updated);
    setCategories(getStoredCategories());
  };

  const reorderCategory = async (dragIndex: number, hoverIndex: number) => {
    const current = [...categories];
    const [moved] = current.splice(dragIndex, 1);
    current.splice(hoverIndex, 0, moved);

    const client = getSupabaseClient();
    if (client) {
      try {
        const updates = current.map((item, idx) => ({
          id: item.id,
          image_url: item.imagePath,
          alt_text: item.altText,
          position: idx + 1
        }));

        await client.from('gallery_items').upsert(updates);
        checkSupabaseStatus();
        return;
      } catch (e) {
        console.error('Error reordering items in Supabase:', e);
      }
    }

    saveCategoriesToStorage(current);
    setCategories(getStoredCategories());
  };

  const clearAll = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('gallery_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        checkSupabaseStatus();
        return;
      } catch (e) {
        console.error('Error clearing Supabase items:', e);
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    saveCategoriesToStorage([]);
    setCategories([]);
  };

  return {
    categories,
    isSupabaseConnected,
    isLoading,
    addCategory,
    removeCategory,
    reorderCategory,
    clearAll,
    refreshSupabase: checkSupabaseStatus
  };
}
