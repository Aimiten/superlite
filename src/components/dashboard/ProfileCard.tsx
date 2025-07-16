
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const ProfileCard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string; company_name?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, company_name')
          .eq('id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [user]);

  return (
    <Card className="card-3d">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Profiili</CardTitle>
        <Link to="/profile">
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{profile?.full_name || "Käyttäjä"}</p>
            {profile?.company_name && (
              <p className="text-sm text-muted-foreground">{profile.company_name}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
