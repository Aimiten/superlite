
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText, 
  CheckSquare,
  Presentation,
  Share2,
  Settings,
  HelpCircle,
  UserCog,
  LogOut,
  Bot,
} from "lucide-react";

export const MAIN_NAV_ITEMS = [
  {
    title: "Työpöytä",
    icon: LayoutDashboard,
    path: "/dashboard",
    description: ""
  },
  {
    title: "Arvonmääritys",
    icon: FileText,
    path: "/valuation",
    description: ""
  },
  {
    title: "Myyntikunto",
    icon: ClipboardCheck,
    path: "/assessment",
    description: ""
  },
  {
    title: "Tehtävät",
    icon: CheckSquare,
    path: "/task-generator",
    description: ""
  },
  {
    title: "Luo myyntiesite",
    icon: Presentation,
    path: "/brochure",
    description: ""
  },
  {
    title: "Kysy AI:lta",
    icon: Bot,
    path: "/ai-assistant",
    description: ""
  },
];

export const UTILITY_NAV_ITEMS = [
  {
    title: "Profiili",
    icon: UserCog,
    path: "/profile",
    description: ""
  },
  {
    title: "Jakaminen",
    icon: Share2,
    path: "/sharing-manager",
    description: ""
  },
  {
    title: "Asetukset",
    icon: Settings,
    path: "/settings",
    description: ""
  },
  {
    title: "Ohjeet",
    icon: HelpCircle,
    path: "/help",
    description: ""
  },
  {
    title: "Kirjaudu ulos",
    icon: LogOut,
    path: "/logout",
    description: "",
    action: "logout" as const
  },
];
