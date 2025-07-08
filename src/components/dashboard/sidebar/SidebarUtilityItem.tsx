
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarUtilityItemProps {
  icon: LucideIcon;
  title: string;
  href?: string;
  onClick?: () => void;
}

const SidebarUtilityItem: React.FC<SidebarUtilityItemProps> = ({
  icon: Icon,
  title,
  href,
  onClick,
}) => {
  const itemContent = (
    <>
      <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
    </>
  );

  const className = "flex items-center px-3 py-2 rounded-md hover:bg-muted transition-colors";

  if (href) {
    if (href.startsWith("http")) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={className} 
          onClick={onClick}
        >
          {itemContent}
        </a>
      );
    }
    
    return (
      <Link to={href} className={className} onClick={onClick}>
        {itemContent}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {itemContent}
    </button>
  );
};

export default SidebarUtilityItem;
