import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Image as ImageIcon, Lock, Share2, Search } from "lucide-react";
import ImageModal from "./ImageModal";

interface Image {
  id: string;
  image_url: string;
  friend_name: string | null;
  birth_date: string | null;
  tags: string[] | null;
  is_private: boolean;
  uploaded_at: string;
  // Local-only field for rendering private images via signed URLs
  signed_url?: string;
}

interface GallerySectionProps {
  userId: string;
}

const GallerySection = ({ userId }: GallerySectionProps) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Image[]>([]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("user_id", userId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      const baseImages = data || [];

      // Attempt to fetch tags from image_metadata using file_path parsed from image_url
      const filePaths = baseImages
        .map((img) => {
          const marker = "/user-images/";
          const idx = img.image_url.indexOf(marker);
          if (idx === -1) return null;
          return img.image_url.substring(idx + marker.length);
        })
        .filter((p): p is string => !!p);

      let metadataMap: Record<string, string[]> = {};
      if (filePaths.length > 0) {
        const { data: metaData } = await supabase
          .from("image_metadata")
          .select("file_path,tags")
          .in("file_path", filePaths);
        (metaData || []).forEach((m: { file_path: string; tags: string[] | null }) => {
          metadataMap[m.file_path] = m.tags || [];
        });
      }

      // Create signed URLs for private bucket access
      const mergedWithSigned: Image[] = await Promise.all(
        baseImages.map(async (img) => {
          const marker = "/user-images/";
          const idx = img.image_url.indexOf(marker);
          const path = idx !== -1 ? img.image_url.substring(idx + marker.length) : undefined;
          const tagsFromMeta = path ? metadataMap[path] : undefined;

          let signedUrl: string | undefined = undefined;
          if (path) {
            try {
              const { data: signed } = await supabase.storage
                .from("user-images")
                .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
              signedUrl = signed?.signedUrl;
            } catch (_e) {
              // fall back silently
            }
          }

          return {
            ...img,
            tags: tagsFromMeta && tagsFromMeta.length > 0 ? tagsFromMeta : img.tags,
            signed_url: signedUrl,
          } as Image;
        })
      );

      setImages(mergedWithSigned);
      setFiltered(mergedWithSigned);
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

  // Client-side search across tags and friend_name
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(images);
      return;
    }
    const results = images.filter((img) => {
      const hay = [img.friend_name || "", ...(img.tags || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
    setFiltered(results);
  }, [query, images]);

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
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search tags or names (e.g., beach, selfie)"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {query && filtered.length === 0 && (
              <div className="text-xs text-muted-foreground mt-2">No results found</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer rounded-xl overflow-hidden shadow-soft transition-all hover:shadow-medium hover:scale-105"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.signed_url || image.image_url}
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
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  {image.is_private ? (
                    <Lock size={16} className="text-white drop-shadow" />
                  ) : null}
                  <button
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const marker = "/user-images/";
                        const idx = image.image_url.indexOf(marker);
                        const path = idx !== -1 ? image.image_url.substring(idx + marker.length) : undefined;
                        if (!path) throw new Error("Invalid path");
                        const slug = crypto.randomUUID().slice(0, 8);
                        let shareUrl = "";
                        try {
                          const { error } = await supabase
                            .from("shared_images")
                            .upsert({ user_id: userId, file_path: path, slug }, { onConflict: "user_id,file_path" });
                          if (error) throw error;
                          shareUrl = `${window.location.origin}/share/${slug}`;
                        } catch (tableErr: any) {
                          // Fallback: if table doesn't exist yet, create a signed URL directly
                          const msg = tableErr?.message || "";
                          if (msg.includes("shared_images") || msg.includes("schema cache") || msg.includes("relation") ) {
                            const { data: signed, error: signErr } = await supabase.storage
                              .from("user-images")
                              .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
                            if (signErr || !signed?.signedUrl) throw tableErr;
                            shareUrl = signed.signedUrl;
                            toast.info("Temporary signed link generated (run DB migration for permanent slugs)");
                          } else {
                            throw tableErr;
                          }
                        }
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Share link copied to clipboard");
                      } catch (err: any) {
                        toast.error(err?.message || "Unable to create share link");
                      }
                    }}
                    aria-label="Share"
                  >
                    <Share2 size={16} className="text-white drop-shadow" />
                  </button>
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
