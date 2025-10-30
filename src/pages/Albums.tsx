import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ImageRow {
  id: string;
  image_url: string;
  friend_name?: string | null;
}

export default function AlbumsPage() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('images')
        .select('id, image_url, friend_name')
        .order('uploaded_at', { ascending: false });
      if (error) { setLoading(false); return; }
      setImages(data || []);
      setLoading(false);
    };
    fetchImages();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Gallery</h2>
      {loading ? (
        <div className="text-center text-muted-foreground py-8 animate-pulse">Loading images...</div>
      ) : images.length === 0 ? (
        <div className="text-lg text-muted-foreground">No images found.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, i) => (
            <motion.div
              className="rounded-xl shadow-lg overflow-hidden bg-white dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 100, damping: 14 }}
              key={img.id}
            >
              <Card>
                <CardContent className="p-0">
                  <img
                    src={img.image_url}
                    alt="Uploaded pic"
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 flex flex-col gap-2">
                    <CardTitle>{img.friend_name || "Untitled"}</CardTitle>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
