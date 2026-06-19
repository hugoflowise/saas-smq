import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileStack,
  FolderTree,
  Gauge,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquareWarning,
  MessagesSquare,
  Milestone,
  Presentation,
  ScrollText,
  Settings,
  ShieldCheck,
  Smile,
  Target,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/** Arborescence de navigation de l'espace tenant (cf. CDC §11). */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { label: "Calendrier qualité", href: "/calendrier", icon: CalendarDays },
      { label: "Réunions QHSE", href: "/reunions", icon: MessagesSquare },
      { label: "Mode audit", href: "/mode-audit", icon: Presentation },
      { label: "Effectif & couverture", href: "/effectif", icon: UsersRound },
    ],
  },
  {
    title: "Stratégie",
    items: [
      { label: "Politique qualité", href: "/strategie/politique", icon: ScrollText },
      { label: "Contexte", href: "/strategie/contexte", icon: Activity },
      { label: "Parties prenantes", href: "/strategie/parties-prenantes", icon: Users },
      { label: "Risques & opportunités", href: "/risques", icon: ShieldCheck },
    ],
  },
  {
    title: "Organisation",
    items: [
      { label: "Processus", href: "/processus", icon: FolderTree },
      { label: "Documentation", href: "/documents", icon: FileStack },
      { label: "Communications", href: "/communications", icon: Megaphone },
    ],
  },
  {
    title: "Amélioration",
    items: [
      { label: "Plan d'actions", href: "/actions", icon: ListChecks },
      { label: "Non-conformités", href: "/nc", icon: AlertTriangle },
      { label: "Réclamations", href: "/reclamations", icon: MessageSquareWarning },
    ],
  },
  {
    title: "Évaluation",
    items: [
      { label: "Objectifs & indicateurs", href: "/strategie/objectifs", icon: Target },
      { label: "Audits", href: "/audits", icon: Gauge },
      { label: "Conformité & veille", href: "/conformite", icon: ClipboardCheck },
      { label: "Revues de direction", href: "/revues/direction", icon: ClipboardCheck },
      { label: "Cycle de certification", href: "/certification", icon: Milestone },
    ],
  },
  {
    title: "Parties externes",
    items: [
      { label: "Satisfaction client", href: "/satisfaction", icon: Smile },
      { label: "Fournisseurs", href: "/fournisseurs", icon: Truck },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Main courante", href: "/journal", icon: History },
      { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
  },
];

/** Section réservée à l'admin Flowise (affichée uniquement pour ce rôle). */
export const ADMIN_NAV_SECTION: NavSection = {
  title: "Admin Flowise",
  items: [{ label: "Clients", href: "/admin/clients", icon: Building2 }],
};
