import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SharedImage = () => {
  const { slug } = useParams();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        if (!slug) return;
        // Lookup the file path by slug, then create a signed URL for viewing
        const { data, error } = await supabase
          .from("shared_images")
          .select("file_path")
          .eq("slug", slug)
          .single();
        if (error || !data) throw error || new Error("Not found");

        const { data: signed } = await supabase.storage
          .from("user-images")
          .createSignedUrl(data.file_path, 60 * 60); // 1 hour

        setImageUrl(signed?.signedUrl || "");
      } catch (e: any) {
        setError(e?.message || "Unable to load image");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Link not available</CardTitle>
            <CardDescription>{error || "This shared link is invalid or expired."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="glass-card shadow-medium max-w-3xl w-full">
        <CardHeader>
          <CardTitle>Shared Image</CardTitle>
          <CardDescription>View-only link</CardDescription>
        </CardHeader>
        <CardContent>
          <img src={imageUrl} alt="Shared" className="w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedImage;


