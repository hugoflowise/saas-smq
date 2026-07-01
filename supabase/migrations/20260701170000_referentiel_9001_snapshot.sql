-- ============================================================================
-- Snapshot du référentiel ISO 9001:2015 (auto-diagnostic).
--
-- Ce référentiel (30 chapitres) n'existait qu'en base de production, jamais
-- dans le repo ni sur staging. On le versionne ici pour qu'il soit reproductible
-- et présent sur tous les environnements. Idempotent : ON CONFLICT DO NOTHING
-- (no-op en prod où les lignes existent déjà, insertion sur staging).
-- ============================================================================

insert into public.referentiel_iso
  (norme, version, chapitre, intitule, description, exigences, preuves_attendues, domaine, est_obligatoire, ordre_affichage)
values
  ('ISO 9001', '2015', '4.1', 'Compréhension de l''organisme et de son contexte', null, null, 'Analyse SWOT/PESTEL documentée, revue annuelle', 'contexte'::public.domaine_iso, true, 0),
  ('ISO 9001', '2015', '4.2', 'Besoins et attentes des parties intéressées', null, null, 'Registre des parties intéressées et de leurs exigences', 'contexte'::public.domaine_iso, true, 1),
  ('ISO 9001', '2015', '4.3', 'Périmètre du système de management de la qualité', null, null, 'Domaine d''application documenté, exclusions justifiées', 'contexte'::public.domaine_iso, true, 2),
  ('ISO 9001', '2015', '4.4', 'Système de management de la qualité et ses processus', null, null, 'Cartographie des processus, interactions, pilotes', 'contexte'::public.domaine_iso, true, 3),
  ('ISO 9001', '2015', '5.1', 'Leadership et engagement', null, null, 'Implication de la direction, revues de direction', 'leadership'::public.domaine_iso, true, 4),
  ('ISO 9001', '2015', '5.1.2', 'Orientation client', null, null, 'Prise en compte des exigences clients et réglementaires', 'leadership'::public.domaine_iso, true, 5),
  ('ISO 9001', '2015', '5.2', 'Politique qualité', null, null, 'Politique qualité documentée, datée, signée, diffusée', 'leadership'::public.domaine_iso, true, 6),
  ('ISO 9001', '2015', '5.3', 'Rôles, responsabilités et autorités', null, null, 'Organigramme, fiches de fonction, responsabilités SMQ', 'leadership'::public.domaine_iso, true, 7),
  ('ISO 9001', '2015', '6.1', 'Actions face aux risques et opportunités', null, null, 'Registre R&O, cotation, plans de traitement', 'planification'::public.domaine_iso, true, 8),
  ('ISO 9001', '2015', '6.2', 'Objectifs qualité et planification', null, null, 'Objectifs SMART, plans d''action associés', 'planification'::public.domaine_iso, true, 9),
  ('ISO 9001', '2015', '6.3', 'Planification des modifications', null, null, 'Gestion des modifications du SMQ', 'planification'::public.domaine_iso, true, 10),
  ('ISO 9001', '2015', '7.1', 'Ressources', null, null, 'Ressources humaines, infrastructures, environnement', 'support'::public.domaine_iso, true, 11),
  ('ISO 9001', '2015', '7.2', 'Compétences', null, null, 'Matrice de compétences, preuves de qualification', 'support'::public.domaine_iso, true, 12),
  ('ISO 9001', '2015', '7.3', 'Sensibilisation', null, null, 'Sensibilisation du personnel à la politique et aux objectifs', 'support'::public.domaine_iso, true, 13),
  ('ISO 9001', '2015', '7.4', 'Communication', null, null, 'Plan de communication interne/externe', 'support'::public.domaine_iso, true, 14),
  ('ISO 9001', '2015', '7.5', 'Informations documentées', null, null, 'Maîtrise documentaire : création, mise à jour, diffusion', 'support'::public.domaine_iso, true, 15),
  ('ISO 9001', '2015', '8.1', 'Planification et maîtrise opérationnelles', null, null, 'Planification des prestations, critères de maîtrise', 'realisation'::public.domaine_iso, true, 16),
  ('ISO 9001', '2015', '8.2', 'Exigences relatives aux produits et services', null, null, 'Revue des exigences, revue d''offre/contrat', 'realisation'::public.domaine_iso, true, 17),
  ('ISO 9001', '2015', '8.3', 'Conception et développement', null, null, 'Maîtrise de la conception (souvent exclu en ESN)', 'realisation'::public.domaine_iso, false, 18),
  ('ISO 9001', '2015', '8.4', 'Maîtrise des prestataires externes', null, null, 'Évaluation et suivi des sous-traitants/fournisseurs', 'realisation'::public.domaine_iso, true, 19),
  ('ISO 9001', '2015', '8.5', 'Production et prestation de service', null, null, 'Maîtrise de la mise en mission et du suivi de prestation', 'realisation'::public.domaine_iso, true, 20),
  ('ISO 9001', '2015', '8.6', 'Libération des produits et services', null, null, 'Vérification de conformité avant livraison', 'realisation'::public.domaine_iso, true, 21),
  ('ISO 9001', '2015', '8.7', 'Maîtrise des éléments de sortie non conformes', null, null, 'Traitement des non-conformités produit/service', 'realisation'::public.domaine_iso, true, 22),
  ('ISO 9001', '2015', '9.1', 'Surveillance, mesure, analyse et évaluation', null, null, 'Tableau de bord d''indicateurs, analyses', 'evaluation'::public.domaine_iso, true, 23),
  ('ISO 9001', '2015', '9.1.2', 'Satisfaction du client', null, null, 'Enquêtes de satisfaction, traitement des retours', 'evaluation'::public.domaine_iso, true, 24),
  ('ISO 9001', '2015', '9.2', 'Audit interne', null, null, 'Programme d''audit, rapports, écarts', 'evaluation'::public.domaine_iso, true, 25),
  ('ISO 9001', '2015', '9.3', 'Revue de direction', null, null, 'Comptes rendus de revue de direction, décisions', 'evaluation'::public.domaine_iso, true, 26),
  ('ISO 9001', '2015', '10.1', 'Amélioration — généralités', null, null, 'Démarche d''amélioration continue', 'amelioration'::public.domaine_iso, true, 27),
  ('ISO 9001', '2015', '10.2', 'Non-conformité et action corrective', null, null, 'Fiches NC, analyse des causes, actions correctives', 'amelioration'::public.domaine_iso, true, 28),
  ('ISO 9001', '2015', '10.3', 'Amélioration continue', null, null, 'Bilan d''efficacité du SMQ, axes de progrès', 'amelioration'::public.domaine_iso, true, 29)
on conflict (norme, version, chapitre) do nothing;
