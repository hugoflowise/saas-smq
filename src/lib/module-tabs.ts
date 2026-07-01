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

export const SUIVI_PRESTATION_TABS: ModuleTab[] = [
  { href: "/suivi-prestation", label: "Comptes rendus" },
  { href: "/suivi-prestation/analyse", label: "Analyse" },
];
