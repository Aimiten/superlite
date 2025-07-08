
import { Building2, Layout, Bot, FileText, Share2, FileBadge } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Myyntikuntoon</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition">
                  Etusivu
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-slate-400 hover:text-white transition">
                  Kirjaudu
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Perusominaisuudet</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-purple-400" />
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition">
                  Dashboard
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ClipboardIcon className="h-4 w-4 text-purple-400" />
                <Link to="/assessment" className="text-slate-400 hover:text-white transition">
                  Myyntikuntoisuuden arviointi
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <BarChart2Icon className="h-4 w-4 text-purple-400" />
                <Link to="/simulator" className="text-slate-400 hover:text-white transition">
                  Arvonmäärityksen simulaattori
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Premium-ominaisuudet</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400">
                  Automaattinen yrityksenarvonmääritys
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400">
                  Yhteistyötyökalut
                </span>
              </li>
              <li className="flex items-center gap-2">
                <FileBadge className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400">
                  Myyntiesitteen luonti
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400">
                  Älykäs Myyntikuntoon-assistentti
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Yhteystiedot</h3>
            <p className="text-slate-400 mb-3">
              Ota yhteyttä ja kysy lisää yrityksesi myyntikuntoisuudesta.
            </p>
            <p className="text-slate-400">
              info@myyntikuntoon.fi
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800">
          <div className="flex items-center space-x-2 mb-6 md:mb-0 bg-slate-800 p-3 rounded-xl">
            <Building2 className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-white">Arvonlaskuri</span>
          </div>
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Arvonlaskuri Työkalu | Kaikki oikeudet pidätetään
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

const ClipboardIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
};

const BarChart2Icon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
};
