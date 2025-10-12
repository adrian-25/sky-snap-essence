import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Lock, Share2 } from "lucide-react";
import ImageModal from "./ImageModal";

interface Image {
  id: string;
  image_url: string;
  friend_name: string | null;
  birth_date: string | null;
  tags: string[] | null;
  is_private: boolean;
  uploaded_at: string;
}

interface GallerySectionProps {
  userId: string;
}

const GallerySection = ({ userId }: GallerySectionProps) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchImages();

      // Subscribe to realtime updates
      const channel = supabase
        .channel("images-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "images",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchImages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className="glass-card shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="text-primary" size={24} />
            My Gallery
          </CardTitle>
          <CardDescription>Loading your memories...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="glass-card shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="text-primary" size={24} />
            My Gallery
          </CardTitle>
          <CardDescription>Your memories will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>No memories yet. Upload your first photo!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="text-primary" size={24} />
            My Gallery
          </CardTitle>
          <CardDescription>{images.length} memories captured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer rounded-xl overflow-hidden shadow-soft transition-all hover:shadow-medium hover:scale-105"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.image_url}
                  alt={image.friend_name || "Memory"}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    {image.friend_name && (
                      <p className="font-medium text-sm">{image.friend_name}</p>
                    )}
                    {image.tags && image.tags.length > 0 && (
                      <p className="text-xs opacity-80 truncate">
                        {image.tags.slice(0, 3).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  {image.is_private ? (
                    <Lock size={16} className="text-white drop-shadow" />
                  ) : (
                    <Share2 size={16} className="text-white drop-shadow" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default GallerySection;
