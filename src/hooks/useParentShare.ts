import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShareLink {
  id: string;
  share_token: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  label: string | null;
  parent_email: string | null;
  digest_enabled: boolean;
  last_digest_sent: string | null;
}

export const useParentShare = () => {
  const { user } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchShareLinks();
    }
  }, [user]);

  const fetchShareLinks = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('parent_share_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setShareLinks(data as ShareLink[]);
    }
    setIsLoading(false);
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(bytes[i] % chars.length);
    }
    return token;
  };

  const createShareLink = async (label?: string, expiresInDays?: number) => {
    if (!user) return null;

    const share_token = generateToken();
    const expires_at = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('parent_share_links')
      .insert({
        user_id: user.id,
        share_token,
        label,
        expires_at
      })
      .select()
      .single();

    if (!error && data) {
      setShareLinks(prev => [data as ShareLink, ...prev]);
      return data as ShareLink;
    }
    return null;
  };

  const deactivateLink = async (id: string) => {
    const { error } = await supabase
      .from('parent_share_links')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      setShareLinks(prev => prev.map(link => 
        link.id === id ? { ...link, is_active: false } : link
      ));
    }
    return { error };
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from('parent_share_links')
      .delete()
      .eq('id', id);

    if (!error) {
      setShareLinks(prev => prev.filter(link => link.id !== id));
    }
    return { error };
  };

  const updateDigestSettings = async (id: string, parentEmail: string | null, digestEnabled: boolean) => {
    const { error } = await supabase
      .from('parent_share_links')
      .update({ 
        parent_email: parentEmail, 
        digest_enabled: digestEnabled 
      })
      .eq('id', id);

    if (!error) {
      setShareLinks(prev => prev.map(link => 
        link.id === id ? { ...link, parent_email: parentEmail, digest_enabled: digestEnabled } : link
      ));
    }
    return { error };
  };

  return {
    shareLinks,
    isLoading,
    createShareLink,
    deactivateLink,
    deleteLink,
    updateDigestSettings,
    refreshLinks: fetchShareLinks
  };
};
