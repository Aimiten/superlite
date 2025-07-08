import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface SidebarBrandingProps {
  collapsed: boolean;
}

const SidebarBranding = ({ collapsed }: SidebarBrandingProps) => {
  return (
    <div className="p-4">
      <Link to="/dashboard" className="flex items-center gap-2 group">
        {!collapsed && (
          <div className="overflow-hidden w-full flex justify-center">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Arvento
            </span>
          </div>
        )}
      </Link>
    </div>
  );
};

export default SidebarBranding;