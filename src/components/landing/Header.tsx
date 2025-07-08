import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, BarChart2 } from "lucide-react";
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
  
  // Lisätään debuggausviestit konsoli-ikkunaan
  console.log("Header render - useNavigation:", useNavigation);
  console.log("Header render - customLinks:", customLinks);
  
  useEffect(() => {
    console.log("Header mounted/updated - useNavigation:", useNavigation);
    console.log("Header mounted/updated - customLinks:", customLinks);
  }, [useNavigation, customLinks]);
  
  const menuItems: MenuItem[] = customLinks || [
    { label: "Etusivu", href: "#" },
    { label: "Ominaisuudet", href: "#pricing" },
    { label: "Hyödyt", href: "#benefits" },
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
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="https://arvento.fi" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700">
            Arvento
          </a>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.href)}
              className="text-slate-600 hover:text-purple-600 transition-colors text-sm font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-purple-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
            >
              {item.label}
            </button>
          ))}
          <Button 
            variant="default" 
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all"
            onClick={() => isLoggedIn ? handleNavigation() : window.open('https://tally.so/r/wQ4WOp', '_blank')}
          >
            {isLoggedIn ? "Siirry sovellukseen" : "Kirjaudu sisään"}
          </Button>
        </nav>
        
        <div className="md:hidden flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-slate-700"
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
          className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg py-4 px-6 flex flex-col space-y-4"
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => scrollToSection(item.href)}
              className="text-slate-700 hover:text-purple-600 transition-colors py-2 text-left"
            >
              {item.label}
            </button>
          ))}
          <Button 
            variant="default" 
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full mt-4"
            onClick={handleNavigation}
          >
            {isLoggedIn ? "Siirry sovellukseen" : "Kirjaudu sisään"}
          </Button>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
