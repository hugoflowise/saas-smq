import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  FolderTree,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquareWarning,
  Presentation,
  ScrollText,
  Settings,
  ShieldCheck,
  Smile,
  Target,
  Users,
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
      { label: "Mode audit", href: "/mode-audit", icon: Presentation },
    ],
  },
  {
    title: "Stratégie",
    items: [
      { label: "Politique qualité", href: "/strategie/politique", icon: ScrollText },
      { label: "Objectifs", href: "/strategie/objectifs", icon: Target },
      { label: "Contexte", href: "/strategie/contexte", icon: Activity },
      { label: "Parties prenantes", href: "/strategie/parties-prenantes", icon: Users },
    ],
  },
  {
    title: "Organisation",
    items: [
      { label: "Processus", href: "/processus", icon: FolderTree },
      { label: "Procédures", href: "/documentation/procedures", icon: FileText },
      { label: "Communications", href: "/communications", icon: Megaphone },
    ],
  },
  {
    title: "Amélioration",
    items: [
      { label: "Plan d'actions", href: "/actions", icon: ListChecks },
      { label: "Non-conformités", href: "/nc", icon: AlertTriangle },
      { label: "Réclamations", href: "/reclamations", icon: MessageSquareWarning },
      { label: "Risques & Opportunités", href: "/risques", icon: ShieldCheck },
    ],
  },
  {
    title: "Évaluation",
    items: [
      { label: "Conformité ISO", href: "/conformite", icon: ClipboardCheck },
      { label: "Indicateurs", href: "/indicateurs", icon: BarChart3 },
      { label: "Audits", href: "/audits", icon: Gauge },
      { label: "Revues de direction", href: "/revues/direction", icon: ClipboardCheck },
    ],
  },
  {
    title: "Suivi",
    items: [
      { label: "Satisfaction", href: "/satisfaction", icon: Smile },
      { label: "Calendrier qualité", href: "/calendrier", icon: CalendarDays },
      { label: "Veille réglementaire", href: "/veille", icon: ScrollText },
    ],
  },
  {
    title: "Configuration",
    items: [{ label: "Paramètres", href: "/parametres", icon: Settings }],
  },
];

/** Section réservée à l'admin Flowise (affichée uniquement pour ce rôle). */
export const ADMIN_NAV_SECTION: NavSection = {
  title: "Admin Flowise",
  items: [{ label: "Clients", href: "/admin/clients", icon: Building2 }],
};
