import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { Send, ImagePlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreatePostProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<any>;
}

export function CreatePost({ onSubmit }: CreatePostProps) {
  const { profile, user } = useAuthContext();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (profile?.full_name) return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('post-images').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !imageFile) || posting) return;
    setPosting(true);

    let imageUrl: string | undefined;
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) imageUrl = url;
    }

    await onSubmit(content, imageUrl);
    setContent('');
    removeImage();
    setPosting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="O que está acontecendo?"
            className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm min-h-[60px]"
            maxLength={500}
          />

          {imagePreview && (
            <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background transition-colors"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors">
                <ImagePlus className="h-4.5 w-4.5" />
              </button>
              <span className="text-xs text-muted-foreground">{content.length}/500</span>
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageFile) || posting}
              className="gap-1.5 rounded-full px-4"
            >
              <Send className="h-3.5 w-3.5" />
              Postar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
