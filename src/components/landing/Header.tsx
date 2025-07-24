import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

interface MenuItem {
  label: string;
  href: string;
}

interface HeaderProps {
  isLoggedIn: boolean;
  handleNavigation: () => void;
  customLinks?: MenuItem[];
  useNavigation?: boolean;
}

const Header = ({ isLoggedIn, handleNavigation, customLinks, useNavigation = false }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const menuItems: MenuItem[] = customLinks || [
    { label: "Ilmainen laskuri", href: "#" },
  ];

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    
    if (useNavigation) {
      // Jos käytämme navigaatiota, käytä react-router-dom navigaatiota
      navigate(id);
      return;
    }
    
    // Muuten käytä normaalia sivun sisäistä scrollausta
    if (id === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    const element = document.getElementById(id.substring(1));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-background sticky top-0 z-50 shadow-neumorphic">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="https://arvento.fi" className="text-xl font-bold text-primary">
            Arvento
          </a>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.href)}
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
            >
              {item.label}
            </button>
          ))}
          <Button 
            variant="default" 
            size="sm"
            className="bg-primary text-primary-foreground rounded-full px-6 shadow-neumorphic-primary hover:shadow-neumorphic-primary-pressed transition-all"
            onClick={handleNavigation}
          >
            {isLoggedIn ? "Dashboard" : "Kirjaudu"}
          </Button>
        </nav>
        
        <div className="md:hidden flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden absolute top-full left-0 right-0 bg-background shadow-neumorphic py-4 px-6 flex flex-col space-y-4"
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.href)}
              className="text-foreground hover:text-primary transition-colors py-2 text-left"
            >
              {item.label}
            </button>
          ))}
          <Button 
            variant="default" 
            size="sm"
            className="bg-primary text-primary-foreground rounded-full mt-4 shadow-neumorphic-primary hover:shadow-neumorphic-primary-pressed transition-all"
            onClick={handleNavigation}
          >
            {isLoggedIn ? "Dashboard" : "Kirjaudu"}
          </Button>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
