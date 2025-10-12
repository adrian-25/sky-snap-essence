import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lock, Share2, Tag } from "lucide-react";

interface Image {
  id: string;
  image_url: string;
  friend_name: string | null;
  birth_date: string | null;
  tags: string[] | null;
  is_private: boolean;
  uploaded_at: string;
}

interface ImageModalProps {
  image: Image | null;
  onClose: () => void;
}

const ImageModal = ({ image, onClose }: ImageModalProps) => {
  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {image.friend_name || "Memory"}
            {image.is_private ? (
              <Lock size={16} className="text-muted-foreground" />
            ) : (
              <Share2 size={16} className="text-primary" />
            )}
          </DialogTitle>
          <DialogDescription>
            Uploaded on {new Date(image.uploaded_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <img
            src={image.image_url}
            alt={image.friend_name || "Memory"}
            className="w-full rounded-xl shadow-medium"
          />

          {image.tags && image.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag size={16} className="text-primary" />
                AI Generated Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {image.birth_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-primary" />
              <span className="font-medium">Birthday:</span>
              {new Date(image.birth_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
