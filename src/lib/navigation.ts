import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileStack,
  FolderTree,
  Gauge,
  HardHat,
  History,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquareWarning,
  MessagesSquare,
  Milestone,
  Presentation,
  Replace,
  Rocket,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Smile,
  Target,
  Trash2,
  Truck,
  UserCog,
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
      { label: "Mise en route", href: "/mise-en-route", icon: Rocket },
      { label: "Calendrier qualité", href: "/calendrier", icon: CalendarDays },
      { label: "Réunions QHSE", href: "/reunions", icon: MessagesSquare },
      { label: "Mode audit", href: "/mode-audit", icon: Presentation },
      { label: "Effectif & couverture", href: "/effectif", icon: UsersRound },
      // Compétences (§7.2) masqué tant que l'intégration Boond n'alimente pas
      // les diplômes/habilitations par collaborateur. La page reste accessible
      // par URL et sera réactivée avec Boond. Voir [[chantier-conformite-9001-staging]].
      { label: "Suivi consultant", href: "/suivi-consultant", icon: ClipboardList },
    ],
  },
  {
    title: "Stratégie",
    items: [
      { label: "Politique qualité", href: "/strategie/politique", icon: ScrollText },
      { label: "Contexte", href: "/strategie/contexte", icon: Activity },
      { label: "Domaine d'application", href: "/strategie/domaine", icon: Milestone },
      { label: "Parties prenantes", href: "/strategie/parties-prenantes", icon: Users },
      { label: "Risques & opportunités", href: "/risques", icon: ShieldCheck },
      { label: "Modifications du SMQ", href: "/modifications-smq", icon: Replace },
    ],
  },
  {
    // Section métier SST/MASE : masquée pour un client qualité seul (gating par norme).
    title: "Maîtrise opérationnelle",
    items: [{ label: "Analyses de risques", href: "/sst/analyses-risques", icon: HardHat }],
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
      { label: "Remontées", href: "/reclamations", icon: MessageSquareWarning },
    ],
  },
  {
    title: "Évaluation",
    items: [
      { label: "Objectifs & indicateurs", href: "/strategie/objectifs", icon: Target },
      { label: "Audits", href: "/audits", icon: Gauge },
      { label: "Auto-diagnostic", href: "/conformite", icon: ClipboardCheck },
      { label: "Veille réglementaire", href: "/veille", icon: Scale },
      { label: "Revues de direction", href: "/revues/direction", icon: ClipboardCheck },
    ],
  },
  {
    title: "Parties externes",
    items: [
      // « Suivi de prestation » est le module unique côté client : le compte
      // rendu BM alimente directement la satisfaction (NPS, notes, réclamations).
      { label: "Suivi de prestation", href: "/suivi-prestation", icon: Smile },
      { label: "Fournisseurs", href: "/fournisseurs", icon: Truck },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Utilisateurs", href: "/utilisateurs", icon: UserCog },
      { label: "Main courante", href: "/journal", icon: History },
      { label: "Paramètres", href: "/parametres", icon: Settings },
      { label: "Corbeille", href: "/corbeille", icon: Trash2 },
    ],
  },
];

/** Items réservés aux gestionnaires d'utilisateurs (dirigeant/admin) : masqués sinon. */
export const NAV_ITEMS_GESTION_UTILISATEURS = ["/utilisateurs"];

/** Section réservée à l'admin Flowise (affichée uniquement pour ce rôle). */
export const ADMIN_NAV_SECTION: NavSection = {
  title: "Admin Flowise",
  items: [
    { label: "Clients", href: "/admin/clients", icon: Building2 },
    { label: "Signalements & suggestions", href: "/admin/retours", icon: Inbox },
  ],
};
