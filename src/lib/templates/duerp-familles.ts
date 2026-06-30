// Familles de risques professionnels (nomenclature type INRS) proposées par
// défaut à chaque client pour le DUERP. Liste PROPOSÉE, éditable par le client
// (ajout / renommage / mise à la corbeille). À valider/ajuster côté métier.
//
// ⚠️ Doit rester synchronisée avec le backfill SQL des clients existants
// (migration 20260630100000_duerp.sql). Toute modification ici = nouveau client ;
// les clients existants gardent ce qui a été inséré par la migration.
export const DUERP_FAMILLES_STANDARDS: { libelle: string; ordre: number }[] = [
  { libelle: "Chutes de plain-pied", ordre: 1 },
  { libelle: "Chutes de hauteur", ordre: 2 },
  { libelle: "Manutention manuelle", ordre: 3 },
  { libelle: "Manutention mécanique / engins", ordre: 4 },
  { libelle: "Circulation interne et déplacements", ordre: 5 },
  { libelle: "Risque routier", ordre: 6 },
  { libelle: "Risque chimique (dont CMR)", ordre: 7 },
  { libelle: "Risque biologique", ordre: 8 },
  { libelle: "Bruit", ordre: 9 },
  { libelle: "Vibrations", ordre: 10 },
  { libelle: "Ambiances thermiques", ordre: 11 },
  { libelle: "Éclairage", ordre: 12 },
  { libelle: "Risque électrique", ordre: 13 },
  { libelle: "Incendie et explosion", ordre: 14 },
  { libelle: "Équipements de travail et machines", ordre: 15 },
  { libelle: "Travail sur écran", ordre: 16 },
  { libelle: "Postures, gestes répétitifs (TMS)", ordre: 17 },
  { libelle: "Risques psychosociaux (RPS)", ordre: 18 },
  { libelle: "Travail isolé", ordre: 19 },
  { libelle: "Rayonnements (ionisants / non ionisants)", ordre: 20 },
  { libelle: "Organisation du travail et horaires atypiques", ordre: 21 },
];
