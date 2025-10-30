import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { loadFaceModels, detectFacesAndEmbeddings } from "@/lib/faceDetection";

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
  const [analyzingFaces, setAnalyzingFaces] = useState(false);
  const [faceEmbeddings, setFaceEmbeddings] = useState<number[][]>([]);

  // Ensure a profile exists and load username (prevents storage policy denials)
  useEffect(() => {
    const ensureProfileAndLoad = async () => {
      if (!userId) return;
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id,username")
        .eq("id", userId)
        .maybeSingle();

      if (prof && !profErr) {
        setUsername(prof.username);
        return;
      }

      // Create a profile if missing using auth metadata/email
      const { data: userRes } = await supabase.auth.getUser();
      const email = userRes.user?.email || "user";
      const metaUsername = (userRes.user?.user_metadata as any)?.username as string | undefined;
      const base = metaUsername?.trim() || (email.includes("@") ? email.split("@")[0] : email);
      const candidate = base || `user_${Date.now()}`;

      // Try to insert; if unique collision, append a suffix
      let finalUsername = candidate;
      let created = false;
      for (let attempt = 0; attempt < 2 && !created; attempt++) {
        const { error: insertErr } = await supabase
          .from("profiles")
          .insert({ id: userId, username: finalUsername })
          .single();
        if (!insertErr) {
          created = true;
          break;
        }
        finalUsername = `${candidate}-${Math.floor(Math.random() * 10000)}`;
      }
      setUsername(finalUsername);
    };

    ensureProfileAndLoad();
  }, [userId]);

  // Load face-api models at component mount (loads from /models)
  useEffect(() => {
    loadFaceModels("/models")
      .catch((err) => console.error("Failed to load face models: ", err));
  }, []);

  // Allowed image types (strict)
  const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
  const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

  const isAllowedImageFile = (f: File): boolean => {
    const mimeOk = f.type ? allowedMimeTypes.has(f.type.toLowerCase()) : false;
    const name = f.name || "";
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
    const extOk = allowedExtensions.has(ext);
    // Accept if MIME or extension matches to handle browsers that omit type
    return mimeOk || extOk;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!isAllowedImageFile(selectedFile)) {
        toast.error("Unsupported file type. Please choose a JPG, JPEG, PNG, or WebP image.");
        setFile(null);
        setPreview("");
        e.currentTarget.value = ""; // reset input so same file can be re-selected
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      // No file selected: clear state to avoid stale preview
      setFile(null);
      setPreview("");
    }
  };

  const handleUpload = async () => {
    // Clear, precise validation and messaging
    if (!file) {
      toast.error("Please select an image file before uploading.");
      return;
    }
    if (!isAllowedImageFile(file)) {
      toast.error("Unsupported file type. Please choose a JPG, JPEG, PNG, or WebP image.");
      return;
    }
    if (!userId) {
      toast.error("You must be signed in to upload.");
      return;
    }
    if (!username) {
      toast.info("Your profile is loading. Please try again in a moment.");
      return;
    }

    setUploading(true);
    setAnalyzingFaces(true);
    try {
      // --- Face Embedding Extraction ---
      let faces: { embedding: number[], box: any }[] = [];
      if (file) {
        // Convert File → HTMLImageElement (must be loaded in DOM)
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        await new Promise(res => { img.onload = res; });
        faces = await detectFacesAndEmbeddings(img);
        URL.revokeObjectURL(url);
        setFaceEmbeddings(faces.map(f => f.embedding));
      }
      setAnalyzingFaces(false);

      // Validate again right before upload (defense-in-depth)
      if (!isAllowedImageFile(file)) {
        throw new Error("Only JPG, JPEG, PNG, or WebP image files are allowed.");
      }
      // Upload to Supabase Storage using username folder
      const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `${username}/${Date.now()}.${fileExt}`; // username-based folder
      const { error: uploadError } = await supabase.storage
        .from("user-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Create a signed URL for immediate secure access and AI analysis
      const { data: signed } = await supabase.storage
        .from("user-images")
        .createSignedUrl(fileName, 60 * 60 * 24); // 24 hours
      const signedUrl = signed?.signedUrl;

      // Get AI tags
      toast.info("🤖 AI is analyzing your photo...", { duration: 2000 });
      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl: signedUrl || '' },
      });

      if (aiError) {
        console.error("AI analysis error:", aiError);
        toast.warning("Uploaded without AI tags");
      }

      const tags = aiData?.tags || [];

      // Save metadata to database using the canonical public URL reference
      const { data: publicUrlData } = supabase.storage
        .from("user-images")
        .getPublicUrl(fileName);
      const { error: dbError } = await supabase.from("images").insert({
        user_id: userId,
        image_url: publicUrlData.publicUrl,
        friend_name: friendName || null,
        birth_date: birthDate || null,
        tags,
        is_private: isPrivate,
        face_embeddings: faces.map(f => JSON.stringify(f.embedding)), // store as JSON-serialized
      });

      if (dbError) throw dbError;

      // Also insert AI tags into image_metadata with storage file path
      const { error: metaError } = await supabase.from("image_metadata").insert({
        user_id: userId,
        file_path: fileName,
        tags,
        face_embeddings: faces.map(f => JSON.stringify(f.embedding)),
      });
      if (metaError) {
        console.warn("image_metadata insert warning:", metaError.message);
      }

      toast.success("Memory uploaded successfully! ☁️");
      
      // Reset form
      setFile(null);
      setPreview("");
      setFriendName("");
      setBirthDate("");
      setIsPrivate(true);
      setFaceEmbeddings([]);
    } catch (error: any) {
      setAnalyzingFaces(false);
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
        {analyzingFaces && (
          <div className="py-3 flex items-center gap-2 animate-pulse">
            <span className="loader mr-2" style={{width:16, height:16, borderRadius:'50%', borderTop:'2px solid #38bdf8', borderRight:'2px solid transparent', animation:'spin 1s linear infinite', display:'inline-block'}}></span>
            <span className="font-medium text-sky-500">Analyzing Faces…</span>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="photo">Photo</Label>
          <Input
            id="photo"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
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
          disabled={!file || uploading || !username}
          className="w-full cloud-gradient text-white"
        >
          {uploading ? "Uploading..." : "Upload Memory"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadSection;
