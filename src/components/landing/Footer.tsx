import { Building2, Layout, Bot, FileText, Share2, FileBadge } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-muted text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between mb-10">
          <div className="md:w-1/4 mb-6 md:mb-0">
            <h3 className="text-lg font-bold mb-4 text-foreground">Arvento</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition">
                  Etusivu
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground">Kirjaudu</span>
              </li>
            </ul>
          </div>

          <div className="md:w-1/3 md:text-right">
            <h3 className="text-lg font-bold mb-4 text-foreground">Tietoa meistä</h3>
            <p className="text-muted-foreground mb-3 max-w-xs md:ml-auto">
              Arvento on Aimiten Oy:n kehittämä arvonmäärityksen ja myyntikunnon kehittämisen työkalu pk-yrityksille.
            </p>
            <p className="text-muted-foreground">
              arvento@aimiten.fi
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Arvento - Aimiten | Kaikki oikeudet pidätetään
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