import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Cloud, LogOut, Upload } from "lucide-react";
import { toast } from "sonner";
import UploadSection from "@/components/dashboard/UploadSection";
import GallerySection from "@/components/dashboard/GallerySection";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [profileBirthday, setProfileBirthday] = useState<string | null>(null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch profile info (username, birthday)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("username,birthday")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfileUsername(data.username || "");
        setProfileBirthday(data.birthday || null);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const isBirthdayToday = useMemo(() => {
    if (!profileBirthday) return false;
    // Parse as local date ignoring timezone to avoid off-by-one
    const [y, m, d] = profileBirthday.split("-").map((v) => parseInt(v, 10));
    if (!y || !m || !d) return false;
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return month === m && day === d;
  }, [profileBirthday]);

  useEffect(() => {
    if (isBirthdayToday) {
      // Small delay so CSS transitions can kick in nicely
      const t = setTimeout(() => setBannerVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setBannerVisible(false);
    }
  }, [isBirthdayToday]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Cloud className="animate-pulse text-primary" size={60} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 cloud-gradient rounded-xl">
              <Cloud className="text-white" size={28} />
            </div>
            <span className="text-xl font-bold">Cloud Memory Gallery</span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isBirthdayToday && (
          <div
            className={`mb-6 rounded-xl p-4 md:p-5 bg-gradient-to-r from-primary to-secondary text-white shadow-medium transform transition-all duration-700 ${bannerVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-sm uppercase tracking-wider opacity-90">Special Day</p>
                <p className="text-lg md:text-xl font-semibold">
                  Happy Birthday{profileUsername ? `, ${profileUsername}` : ""}! 🎂 Wishing you a wonderful day!
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-8">
          <UploadSection userId={user?.id || ""} />
          <GallerySection userId={user?.id || ""} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
