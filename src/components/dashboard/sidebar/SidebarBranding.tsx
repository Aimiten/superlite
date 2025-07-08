
import { Link } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarBrandingProps {
  collapsed: boolean;
}

const SidebarBranding = ({ collapsed }: SidebarBrandingProps) => {
  return (
    <div className="p-4">
      <Link to="/dashboard" className="flex items-center gap-2 group">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg shadow-md">
          <div className="flex items-center text-white">
            <BarChart2 className="h-5 w-5" />
          </div>
        </div>
        
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700"
          >
            Arvonlaskuri
          </motion.span>
        )}
      </Link>
    </div>
  );
};

export default SidebarBranding;
