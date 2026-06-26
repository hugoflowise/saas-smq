import type { ModuleTab } from "@/components/module-tabs";

/** Onglets des modules regroupés (cf. refonte navigation). */

export const PERFORMANCE_TABS: ModuleTab[] = [
  { href: "/strategie/objectifs", label: "Objectifs" },
  { href: "/indicateurs", label: "Indicateurs" },
];

export const DOCUMENTATION_TABS: ModuleTab[] = [
  { href: "/documents", label: "Liste maîtresse des documents" },
  { href: "/documentation/procedures", label: "Procédures" },
];

export const SATISFACTION_TABS: ModuleTab[] = [
  { href: "/satisfaction", label: "Enquêtes & NPS" },
  { href: "/suivi-prestation", label: "Suivi de prestation" },
];
