// src/components/dashboard/sidebar/SidebarUserInfo.tsx
import React from "react";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SidebarUserInfo: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!user) return null;

  const email = user.email || "";
  // Luodaan lyhenne sähköpostista (ennen @-merkkiä)
  const shortEmail = email.split('@')[0];

  return (
    <div className="mb-1">
      <div className={cn(
        "flex items-center px-3 py-2 rounded-md hover:bg-muted transition-colors",
        "cursor-default" // Ei osoita kursoria koska tämä ei ole klikattava
      )}>
        <UserCircle className="h-5 w-5 mr-3 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate">
            {isMobile ? shortEmail : email}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SidebarUserInfo;