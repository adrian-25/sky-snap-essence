import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cloud, Sparkles, Lock, Image } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 cloud-gradient opacity-30" />
      <Cloud className="absolute top-20 left-10 text-primary/10 animate-float" size={120} />
      <Cloud className="absolute bottom-20 right-20 text-secondary/10 animate-float-delayed" size={100} />
      <Cloud className="absolute top-1/3 right-10 text-accent/10 animate-float" size={80} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="p-6 cloud-gradient rounded-3xl shadow-medium animate-pulse">
              <Cloud className="text-white" size={80} />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Cloud Memory Gallery 2.0
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Store your precious memories in the cloud with AI-powered tagging, face recognition, and intelligent organization
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="cloud-gradient text-white px-8 py-6 text-lg shadow-medium hover:shadow-lg transition-all"
            >
              Get Started
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="glass-card p-6 rounded-2xl shadow-soft space-y-3">
              <Sparkles className="text-primary mx-auto" size={40} />
              <h3 className="font-bold text-lg">AI Tagging</h3>
              <p className="text-sm text-muted-foreground">
                Automatically tag your photos with AI-powered recognition
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-soft space-y-3">
              <Lock className="text-primary mx-auto" size={40} />
              <h3 className="font-bold text-lg">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your memories are encrypted and stored securely in the cloud
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-soft space-y-3">
              <Image className="text-primary mx-auto" size={40} />
              <h3 className="font-bold text-lg">Smart Gallery</h3>
              <p className="text-sm text-muted-foreground">
                Beautiful masonry layout with intelligent organization
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-muted-foreground">
        💭 Powered by Supabase Cloud + AI | Designed with ❤️ for Memories
      </footer>
    </div>
  );
};

export default Index;
