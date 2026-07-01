-- ============================================================================
-- Seed du référentiel MASE 2024 — AXE 1 : Engagement de la Direction (60 questions).
--
-- Questions officielles transcrites du manuel MASE 2024 (pp. 17-27), avec points,
-- type de cotation (B binaire / V variable / VD variable doublée) et drapeau de
-- neutralisation. norme='MASE', version='2024', groupées par axe (=1).
-- Idempotent : ON CONFLICT (norme, version, chapitre) DO NOTHING.
-- Axes 2 à 5 seedés dans des migrations ultérieures.
-- ============================================================================

insert into public.referentiel_iso
  (norme, version, chapitre, intitule, axe, points_max, cotation_type, neutralisable, est_obligatoire, ordre_affichage)
values
  ('MASE', '2024', '1.1.1', 'L''employeur sait-il expliquer les engagements SÉCURITÉ SANTÉ ENVIRONNEMENT qu''il a pris pour son entreprise : sa politique, ses objectifs, son organisation, ses indicateurs SSE, sa planification, sa documentation, ses dispositifs d''information et d''animation et les moyens nécessaires qu''il a définis et mis en œuvre ?', 1, 80, 'VD', false, true, 1000),
  ('MASE', '2024', '1.1.2', 'L''employeur prend-il en compte, dans sa démarche SSE, l''intégralité des acteurs de l''entreprise (personnel organique, personnel temporaire…) et des sous-traitants ?', 1, 20, 'V', false, true, 1001),
  ('MASE', '2024', '1.1.3', 'L''employeur affiche-t-il son engagement personnel en participant aux réunions, audits/visites SSE avec le personnel, et enquêtes sur les situations dangereuses, presqu''accidents et accidents, maladies professionnelles, impacts environnementaux… ?', 1, 50, 'V', false, true, 1002),
  ('MASE', '2024', '1.2.1', 'La politique formalise-t-elle les principes essentiels SSE de l''employeur ?', 1, 15, 'VD', false, true, 1003),
  ('MASE', '2024', '1.2.2', 'Cette politique est-elle datée et signée par l''employeur ?', 1, 5, 'B', false, true, 1004),
  ('MASE', '2024', '1.2.3', 'Cette politique est-elle diffusée à l''intégralité des acteurs de l''entreprise (personnel organique et personnel temporaire) ?', 1, 5, 'B', false, true, 1005),
  ('MASE', '2024', '1.2.4', 'La politique couvre-t-elle le domaine : Sécurité ?', 1, 5, 'B', false, true, 1006),
  ('MASE', '2024', '1.2.5', 'La politique couvre-t-elle le domaine : Santé ?', 1, 5, 'B', false, true, 1007),
  ('MASE', '2024', '1.2.6', 'La politique couvre-t-elle le domaine : Environnement ?', 1, 5, 'B', false, true, 1008),
  ('MASE', '2024', '1.3.1', 'Les objectifs couvrent-ils le domaine : Sécurité ?', 1, 5, 'B', false, true, 1009),
  ('MASE', '2024', '1.3.2', 'Les objectifs couvrent-ils le domaine : Santé ?', 1, 5, 'B', false, true, 1010),
  ('MASE', '2024', '1.3.3', 'Les objectifs couvrent-ils le domaine : Environnement ?', 1, 5, 'B', false, true, 1011),
  ('MASE', '2024', '1.3.4', 'Les objectifs sont-ils adaptés ?', 1, 15, 'V', false, true, 1012),
  ('MASE', '2024', '1.3.5', 'Les objectifs sont-ils mesurables ?', 1, 15, 'V', false, true, 1013),
  ('MASE', '2024', '1.3.6', 'Les objectifs sont-ils atteignables ?', 1, 15, 'V', false, true, 1014),
  ('MASE', '2024', '1.3.7', 'Les objectifs sont-ils fixés dans le temps ?', 1, 15, 'V', false, true, 1015),
  ('MASE', '2024', '1.3.8', 'L''employeur a-t-il mis en œuvre des moyens matériels et des facteurs organisationnels et humains qui vont permettre de les atteindre ?', 1, 25, 'VD', false, true, 1016),
  ('MASE', '2024', '1.4.1', 'Les indicateurs de suivi couvrent-ils le domaine : Sécurité ?', 1, 5, 'B', false, true, 1017),
  ('MASE', '2024', '1.4.2', 'Les indicateurs de suivi couvrent-ils le domaine : Santé ?', 1, 5, 'B', false, true, 1018),
  ('MASE', '2024', '1.4.3', 'Les indicateurs de suivi couvrent-ils le domaine : Environnement ?', 1, 5, 'B', false, true, 1019),
  ('MASE', '2024', '1.4.4', 'Les indicateurs de suivi SSE sont-ils pertinents pour l''atteinte des objectifs ?', 1, 40, 'VD', false, true, 1020),
  ('MASE', '2024', '1.4.5', 'Les indicateurs de résultats couvrent-ils le domaine : Sécurité ?', 1, 5, 'B', false, true, 1021),
  ('MASE', '2024', '1.4.6', 'Les indicateurs de résultats couvrent-ils le domaine : Santé ?', 1, 5, 'B', false, true, 1022),
  ('MASE', '2024', '1.4.7', 'Les indicateurs de résultats couvrent-ils le domaine : Environnement ?', 1, 5, 'B', false, true, 1023),
  ('MASE', '2024', '1.4.8', 'Les indicateurs de résultats SSE sont-ils pertinents pour l''atteinte des objectifs ?', 1, 20, 'VD', false, true, 1024),
  ('MASE', '2024', '1.5.1', 'L''employeur a-t-il défini les missions nécessaires au fonctionnement dans le domaine : Sécurité ?', 1, 5, 'B', false, true, 1025),
  ('MASE', '2024', '1.5.2', 'L''employeur a-t-il défini les missions nécessaires au fonctionnement dans le domaine : Santé ?', 1, 5, 'B', false, true, 1026),
  ('MASE', '2024', '1.5.3', 'L''employeur a-t-il défini les missions nécessaires au fonctionnement dans le domaine : Environnement ?', 1, 5, 'B', false, true, 1027),
  ('MASE', '2024', '1.5.4', 'Ces missions en matière de SSE sont-elles attribuées à des personnes identifiées ?', 1, 10, 'B', false, true, 1028),
  ('MASE', '2024', '1.5.5', 'Ces personnes sont-elles compétentes pour effectuer leurs missions en matière de SSE ?', 1, 40, 'V', false, true, 1029),
  ('MASE', '2024', '1.5.6', 'Ces personnes ont-elles connaissance de leurs missions en matière de SSE ?', 1, 20, 'V', false, true, 1030),
  ('MASE', '2024', '1.5.7', 'L''employeur a-t-il mis en place un dispositif de veille des exigences réglementaires qui lui sont applicables en matière de SSE ?', 1, 10, 'B', false, true, 1031),
  ('MASE', '2024', '1.5.8', 'L''employeur a-t-il fait le récolement des exigences qui lui sont applicables en matière de SSE à partir de sa veille réglementaire ?', 1, 30, 'V', false, true, 1032),
  ('MASE', '2024', '1.5.9', 'L''employeur a-t-il mis en place une organisation de concertation SSE avec des personnels de l''entreprise (IRP, autres, …) ?', 1, 5, 'B', true, true, 1033),
  ('MASE', '2024', '1.5.10', 'Le règlement intérieur (si applicable) est-il à disposition de tous les personnels ?', 1, 5, 'B', true, true, 1034),
  ('MASE', '2024', '1.5.11', 'L''employeur a-t-il mis en place un dispositif lui permettant de réaliser les contrôles obligatoires (par la réglementation ou les notices fabricants) ?', 1, 10, 'B', false, true, 1035),
  ('MASE', '2024', '1.5.12', 'Le dispositif couvre-t-il l''ensemble des contrôles obligatoires (bâtiments, véhicules, engins, équipements de travail, machines-outils, EPC, EPI) ?', 1, 20, 'V', false, true, 1036),
  ('MASE', '2024', '1.5.13', 'L''employeur a-t-il mis en place un dispositif lui permettant la levée de l''ensemble des écarts constatés lors de tous les contrôles réglementaires obligatoires ?', 1, 30, 'V', false, true, 1037),
  ('MASE', '2024', '1.5.14', 'L''employeur a-t-il mis en place un dispositif de remontées d''informations SSE ?', 1, 10, 'B', false, true, 1038),
  ('MASE', '2024', '1.5.15', 'Le dispositif de remontées d''informations permet-il d''alimenter le plan d''actions SSE (en nombre et en qualité) ?', 1, 30, 'VD', false, true, 1039),
  ('MASE', '2024', '1.5.16', 'L''employeur a-t-il mis en place une organisation de pilotage ?', 1, 10, 'B', false, true, 1040),
  ('MASE', '2024', '1.5.17', 'Cette organisation permet-elle à la structure de l''entreprise de suivre le pilotage de son système (suivi des indicateurs, de l''état d''avancement de ses plans d''actions, …) ?', 1, 40, 'V', false, true, 1041),
  ('MASE', '2024', '1.6.1.1', 'L''employeur enregistre-t-il l''ensemble des actions prises (soldées immédiatement ou différées) dans les domaines SSE ?', 1, 20, 'V', false, true, 1042),
  ('MASE', '2024', '1.6.1.2', 'Ce(s) plan(s) d''actions permet(tent)-il(s) de piloter le suivi des actions dans les domaines SSE ?', 1, 50, 'VD', false, true, 1043),
  ('MASE', '2024', '1.6.1.3', 'Les actions de prévention sont-elles planifiées (réunions SSE, …) ?', 1, 10, 'B', false, true, 1044),
  ('MASE', '2024', '1.6.1.4', 'Ce(s) plan(s) d''actions contient(nent)-il(s) a minima les 5 rubriques obligatoires ?', 1, 5, 'B', false, true, 1045),
  ('MASE', '2024', '1.6.1.5', 'L''employeur connaît-il l''état d''avancement du (des) plan(s) d''actions ?', 1, 20, 'V', false, true, 1046),
  ('MASE', '2024', '1.6.2.1', 'Existe-t-il un dispositif documentaire (consignes, instructions, procédures, autres…) ?', 1, 5, 'B', false, true, 1047),
  ('MASE', '2024', '1.6.2.2', 'Est-il adapté à l''entreprise ?', 1, 10, 'B', false, true, 1048),
  ('MASE', '2024', '1.6.2.3', 'Les moyens sont-ils évalués dans les exercices budgétaires de l''entreprise ?', 1, 10, 'B', false, true, 1049),
  ('MASE', '2024', '1.7.1', 'Existe-t-il un dispositif d''information (affiche, journal d''entreprise, vidéo, autres) ?', 1, 5, 'B', false, true, 1050),
  ('MASE', '2024', '1.7.2', 'Existe-t-il un dispositif d''animation (réunion SSE, challenge, …) ?', 1, 10, 'B', false, true, 1051),
  ('MASE', '2024', '1.7.3', 'Le dispositif d''information s''adresse-t-il à tout le personnel (organique et non-organique) de l''entreprise ?', 1, 15, 'V', true, true, 1052),
  ('MASE', '2024', '1.7.4', 'Le dispositif d''animation concerne-t-il tout le personnel (organique et non-organique) de l''entreprise ?', 1, 30, 'V', true, true, 1053),
  ('MASE', '2024', '1.7.5', 'Les risques principaux de l''entreprise en terme de SSE font-ils l''objet d''animations ?', 1, 15, 'V', false, true, 1054),
  ('MASE', '2024', '1.7.6', 'Les dispositifs d''information et d''animation couvrent-ils le domaine : Sécurité ?', 1, 5, 'B', false, true, 1055),
  ('MASE', '2024', '1.7.7', 'Les dispositifs d''information et d''animation couvrent-ils le domaine : Santé ?', 1, 5, 'B', false, true, 1056),
  ('MASE', '2024', '1.7.8', 'Les dispositifs d''information et d''animation couvrent-ils le domaine : Environnement ?', 1, 5, 'B', false, true, 1057),
  ('MASE', '2024', '1.7.9', 'Les animations font-elles l''objet d''un enregistrement ?', 1, 10, 'B', false, true, 1058),
  ('MASE', '2024', '1.7.10', 'L''affichage réglementaire est-il respecté ?', 1, 5, 'B', true, true, 1059)
on conflict (norme, version, chapitre) do nothing;
