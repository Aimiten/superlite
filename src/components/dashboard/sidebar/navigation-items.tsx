import {
  LayoutDashboard,
  FileText, 
  Presentation,
  Share2,
  Settings,
  HelpCircle,
  UserCog,
  LogOut,
  Bot,
  MessageSquare,
  FileStack, // Added import for FileStack icon
  TrendingUp,
  Calculator,
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
    title: "Jakaminen",
    icon: Share2,
    path: "/sharing-manager",
    description: ""
  },
  {
    title: "Kysy AI:lta",
    icon: Bot,
    path: "/ai-assistant",
    description: ""
  },

  {
    title: "Keskusteluhistoria",
    icon: FileStack, // Changed icon to FileStack
    path: "/ai-assistant-history",
    description: ""
  },
  {
    title: "Simulaattori",
    icon: TrendingUp,
    path: "/simulator",
    description: "",
    requiresValuation: true
  },
  {
    title: "DCF-analyysi",
    icon: Calculator,
    path: "/dcf-analysis",
    description: "",
    requiresValuation: true
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