import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface UploadSectionProps {
  userId: string;
}

const UploadSection = ({ userId }: UploadSectionProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [friendName, setFriendName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState<string>("");

  // Fetch username on mount
  useEffect(() => {
    const fetchUsername = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      
      if (data && !error) {
        setUsername(data.username);
      }
    };
    
    if (userId) {
      fetchUsername();
    }
  }, [userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file || !userId || !username) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage using username folder
      const fileExt = file.name.split(".").pop();
      const fileName = `${username}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("user-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("user-images")
        .getPublicUrl(fileName);

      // Get AI tags
      toast.info("🤖 AI is analyzing your photo...", { duration: 2000 });
      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl: urlData.publicUrl },
      });

      if (aiError) {
        console.error("AI analysis error:", aiError);
        toast.warning("Uploaded without AI tags");
      }

      const tags = aiData?.tags || [];

      // Save metadata to database
      const { error: dbError } = await supabase.from("images").insert({
        user_id: userId,
        image_url: urlData.publicUrl,
        friend_name: friendName || null,
        birth_date: birthDate || null,
        tags,
        is_private: isPrivate,
      });

      if (dbError) throw dbError;

      toast.success("Memory uploaded successfully! ☁️");
      
      // Reset form
      setFile(null);
      setPreview("");
      setFriendName("");
      setBirthDate("");
      setIsPrivate(true);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="glass-card shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="text-primary" size={24} />
          Upload Memory
        </CardTitle>
        <CardDescription>Share a moment with AI-powered tagging</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="photo">Photo</Label>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {preview && (
            <div className="mt-4 relative rounded-xl overflow-hidden shadow-soft">
              <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
              <div className="absolute top-2 right-2 bg-primary/80 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Sparkles size={12} />
                AI Ready
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="friendName">Friend's Name (Optional)</Label>
          <Input
            id="friendName"
            placeholder="e.g., Alex"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Birthday (Optional)</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="privacy">Privacy Setting</Label>
            <div className="text-sm text-muted-foreground">
              {isPrivate ? "Private (Only you can see)" : "Shared (Generate link)"}
            </div>
          </div>
          <Switch
            id="privacy"
            checked={!isPrivate}
            onCheckedChange={(checked) => setIsPrivate(!checked)}
            disabled={uploading}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full cloud-gradient text-white"
        >
          {uploading ? "Uploading..." : "Upload Memory"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadSection;
