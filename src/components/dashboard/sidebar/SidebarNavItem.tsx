import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  icon: LucideIcon;
  title: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  title,
  href,
  isActive,
  onClick,
  badge,
  badgeColor = "bg-primary",
  disabled = false,
}) => {
  const isExternal = href.startsWith("http");

  const itemContent = (
    <>
      <div className="flex items-center">
        <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-sm font-medium", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
          {title}
        </span>
      </div>
      {badge && (
        <div className={cn("px-2 py-0.5 rounded-full text-xs font-medium text-white", badgeColor)}>
          {badge}
        </div>
      )}
    </>
  );

  const className = cn(
    "flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted transition-colors",
    isActive && "bg-muted",
    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
  );

  if (disabled) {
    return (
      <div className={className}>
        {itemContent}
      </div>
    );
  }

  if (isExternal) {
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
};

export default React.memo(SidebarNavItem);