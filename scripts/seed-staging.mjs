// Seed de DÉMO pour l'environnement STAGING uniquement.
// Crée un utilisateur de connexion + un client fictif rempli sur tous les modules.
// Exécuté via l'API Management Supabase (SQL), JAMAIS via une migration (sinon prod).
//   node scripts/seed-staging.mjs           (source .env.local d'abord pour SUPABASE_ACCESS_TOKEN)
import { randomUUID } from "node:crypto";

const REF = "bsiwwzfundeueiirufmn"; // flowise-staging
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("❌ SUPABASE_ACCESS_TOKEN manquant (source .env.local).");
  process.exit(1);
}

const EMAIL = "demo@flowise.fr";
const PASSWORD = "DemoStaging2026!";

// ── UUID fixes pour les références croisées
const T = randomUUID(); // tenant
const U = randomUUID(); // user
const P = Array.from({ length: 6 }, () => randomUUID()); // processus
const I = Array.from({ length: 4 }, () => randomUUID()); // indicateurs
const REV = randomUUID(); // revue de direction

const q = (s) => `'${String(s).replace(/'/g, "''")}'`; // échappe une chaîne SQL
const j = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;

const sql = `
begin;

-- 1) Tenant (client de démo)
insert into public.tenants (id, nom_societe, formule, statut, secteur, effectif_tranche, date_souscription, couleur_charte)
values (${q(T)}, ${q("Démo Qualité (staging)")}, 'Premium', 'Actif', 'ESN', '10-49', current_date, '#4f46e5');

-- 2) Utilisateur de connexion (login direct par mot de passe)
-- NB : les colonnes de tokens doivent être '' (pas NULL) sinon GoTrue échoue au login.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values (${q(U)}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${q(EMAIL)},
        extensions.crypt(${q(PASSWORD)}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Démo Dirigeant"}'::jsonb, now(), now(),
        '', '', '', '', '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), ${q(U)}, ${q(U)}, ${j({ sub: U, email: EMAIL })}, 'email', now(), now(), now());

-- 3) Profil (créé par trigger) rattaché au tenant, dirigeant, accès direct
update public.profiles set tenant_id = ${q(T)}, role = 'dirigeant', full_name = 'Démo Dirigeant', must_set_password = false where id = ${q(U)};

-- 4) Processus
insert into public.processus (id, tenant_id, nom, type, ordre_affichage, description) values
 (${q(P[0])}, ${q(T)}, 'Pilotage & amélioration', 'pilotage', 0, 'Pilotage du SMQ, revues et amélioration continue'),
 (${q(P[1])}, ${q(T)}, 'Écoute client & commercial', 'realisation', 1, 'Avant-vente, contractualisation, satisfaction'),
 (${q(P[2])}, ${q(T)}, 'Réalisation des prestations', 'realisation', 2, 'Exécution des missions de conseil'),
 (${q(P[3])}, ${q(T)}, 'Recrutement & RH', 'support', 3, 'Recrutement, compétences, RH'),
 (${q(P[4])}, ${q(T)}, 'Achats & prestataires', 'support', 4, 'Sélection et suivi des prestataires externes'),
 (${q(P[5])}, ${q(T)}, 'Système d''information', 'support', 5, 'Moyens informatiques et sécurité');

-- 5) Indicateurs + valeurs
insert into public.indicateurs (id, tenant_id, nom, processus_id, type, unite, cible, sens, frequence_mesure, source) values
 (${q(I[0])}, ${q(T)}, 'Taux de satisfaction client', ${q(P[1])}, 'percentage', '%', 90, 'hausse', 'mensuel', 'manuel'),
 (${q(I[1])}, ${q(T)}, 'Délai de traitement des NC (jours)', ${q(P[0])}, 'duration', 'j', 15, 'baisse', 'mensuel', 'manuel'),
 (${q(I[2])}, ${q(T)}, 'Taux de staffing', ${q(P[3])}, 'percentage', '%', 95, 'hausse', 'mensuel', 'manuel'),
 (${q(I[3])}, ${q(T)}, 'Nombre de réclamations', ${q(P[1])}, 'count', 'nb', 2, 'baisse', 'trimestriel', 'manuel');
insert into public.indicateurs_valeurs (tenant_id, indicateur_id, valeur, date_mesure) values
 (${q(T)}, ${q(I[0])}, 88, current_date - 60), (${q(T)}, ${q(I[0])}, 92, current_date - 20),
 (${q(T)}, ${q(I[1])}, 22, current_date - 60), (${q(T)}, ${q(I[1])}, 12, current_date - 20),
 (${q(T)}, ${q(I[2])}, 91, current_date - 30), (${q(T)}, ${q(I[2])}, 96, current_date - 5),
 (${q(T)}, ${q(I[3])}, 4, current_date - 40), (${q(T)}, ${q(I[3])}, 1, current_date - 10);

-- 6) Revue de direction (avec champs §9.3 remplis)
insert into public.revues_direction (id, tenant_id, annee, date_realisation, statut,
  participants, entree_actions_anterieures, entree_evolution_contexte, entree_performance_synthese,
  entree_ressources, entree_efficacite_actions, entree_opportunites,
  sortie_amelioration, sortie_changements, sortie_ressources, points_specifiques)
values (${q(REV)}, ${q(T)}, extract(year from current_date)::int, current_date - 15, 'realisee',
  ${j([
    { nom: "Démo Dirigeant", fonction: "Dirigeant" },
    { nom: "Léa Martin", fonction: "Responsable qualité" },
    { nom: "Paul Durand", fonction: "Responsable opérations" },
  ])},
  'Les actions de la revue précédente sont soldées à 80 %.',
  'Marché du conseil en tension ; nouvelle réglementation cyber à intégrer.',
  'Objectifs globalement atteints, satisfaction client en hausse (NPS positif).',
  'Effectif stable, besoin d''un référent qualité à mi-temps.',
  'Les actions face aux risques majeurs ont réduit la criticité résiduelle.',
  'Automatiser le suivi de satisfaction ; renforcer l''onboarding consultants.',
  'Déployer une enquête de satisfaction trimestrielle systématique.',
  'Mettre à jour la cartographie des processus suite à la réorganisation.',
  'Budget formation +15 % ; recrutement d''un alternant qualité.',
  'Focus activité conseil nucléaire : maintien des habilitations à surveiller.');

-- 7) Actions (dont 2 rattachées à la revue)
insert into public.actions (tenant_id, reference, description_courte, origine, type, priorite, statut, processus_concerne, date_prevue, revue_id) values
 (${q(T)}, 'ACT-D-001', 'Mettre à jour le manuel d''accueil', 'manuelle', 'preventive', 'p2', 'en_cours', ${q(P[3])}, current_date + 20, null),
 (${q(T)}, 'ACT-D-002', 'Analyser la NC livrable tardif', 'nc', 'corrective', 'p1', 'a_faire', ${q(P[2])}, current_date + 10, null),
 (${q(T)}, 'ACT-D-003', 'Auditer le prestataire hébergement', 'audit_interne', 'preventive', 'p2', 'a_faire', ${q(P[4])}, current_date - 5, null),
 (${q(T)}, 'ACT-D-004', 'Plan de formation cybersécurité', 'r_o', 'preventive', 'p2', 'en_cours', ${q(P[5])}, current_date + 30, null),
 (${q(T)}, 'ACT-D-005', 'Clôturer réclamation client X', 'reclamation', 'corrective', 'p1', 'termine', ${q(P[1])}, current_date - 12, null),
 (${q(T)}, 'ACT-D-006', 'Déployer l''enquête satisfaction trimestrielle', 'rdd', 'preventive', 'p2', 'a_faire', ${q(P[1])}, current_date + 45, ${q(REV)}),
 (${q(T)}, 'ACT-D-007', 'Renforcer l''onboarding consultants', 'rdd', 'preventive', 'p3', 'a_faire', ${q(P[3])}, current_date + 60, ${q(REV)});

-- 8) Contexte (SWOT / PESTEL)
insert into public.contexte_organisme (tenant_id, analyse_swot, analyse_pestel, date_revue, prochain_revue) values
 (${q(T)},
  ${j({ forces: ["Expertise reconnue", "Fidélité client"], faiblesses: ["Dépendance à quelques clients"], opportunites: ["Marché cyber en croissance"], menaces: ["Tension sur les recrutements"] })},
  ${j({ politique: ["Cadre réglementaire stable"], economique: ["Budgets clients sous pression"], sociologique: ["Attentes RSE"], technologique: ["IA générative"], ecologique: ["Sobriété numérique"], legal: ["RGPD", "NIS2"] })},
  current_date - 30, current_date + 335);

-- 9) Parties intéressées
insert into public.parties_interessees (tenant_id, nom, type, sphere, niveau_interaction, pouvoir, legitimite, urgence) values
 (${q(T)}, 'Clients grands comptes', 'client', 'externe', 'forte', 3, 3, 2),
 (${q(T)}, 'Consultants', 'collaborateur', 'interne', 'forte', 2, 3, 2),
 (${q(T)}, 'Organisme de certification', 'autorite', 'externe', 'moyenne', 3, 3, 1),
 (${q(T)}, 'Prestataires IT', 'fournisseur', 'externe', 'moyenne', 2, 2, 1);

-- 10) Politique qualité (publiée)
insert into public.politique_qualite (tenant_id, contenu, statut, code, approved_at) values
 (${q(T)}, ${j({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Notre engagement : satisfaire durablement nos clients par des prestations de conseil de haute qualité, dans le respect des exigences ISO 9001." }] }] })}, 'publiee', 'POL-001', now() - interval '20 days');

-- 11) Objectifs qualité
insert into public.objectifs_qualite (tenant_id, intitule, est_smart, valeur_cible, valeur_actuelle, unite, sens, echeance, statut, processus_id, indicateur_id) values
 (${q(T)}, 'Atteindre 90 % de satisfaction client', true, 90, 92, '%', 'hausse', make_date(extract(year from current_date)::int, 12, 31), 'actif', ${q(P[1])}, ${q(I[0])}),
 (${q(T)}, 'Réduire le délai de traitement des NC à 15 j', true, 15, 12, 'j', 'baisse', make_date(extract(year from current_date)::int, 12, 31), 'actif', ${q(P[0])}, ${q(I[1])}),
 (${q(T)}, 'Maintenir un taux de staffing > 95 %', true, 95, 96, '%', 'hausse', make_date(extract(year from current_date)::int, 12, 31), 'atteint', ${q(P[3])}, ${q(I[2])}),
 (${q(T)}, 'Certifier 100 % des consultants au process qualité', true, 100, 70, '%', 'hausse', make_date(extract(year from current_date)::int, 9, 30), 'actif', ${q(P[3])}, null);

-- 12) Risques & opportunités
insert into public.risques_opportunites (tenant_id, intitule, type, processus_id, cause, consequence, gravite, probabilite, gravite_residuelle, probabilite_residuelle, statut, date_revue) values
 (${q(T)}, 'Perte d''un client majeur', 'risque', ${q(P[1])}, 'Dépendance commerciale', 'Baisse de CA', 4, 4, 4, 2, 'en_traitement', current_date + 30),
 (${q(T)}, 'Indisponibilité d''un consultant clé', 'risque', ${q(P[2])}, 'Arrêt maladie', 'Retard livrable', 3, 3, 2, 2, 'maitrise', current_date + 60),
 (${q(T)}, 'Fuite de données client', 'risque', ${q(P[5])}, 'Faille de sécurité', 'Sanction RGPD', 5, 3, 5, 1, 'en_traitement', current_date + 20),
 (${q(T)}, 'Nouveau marché cybersécurité', 'opportunite', ${q(P[1])}, 'Demande croissante', 'Croissance CA', 4, 4, null, null, 'identifie', current_date + 45);

-- 13) Non-conformités
insert into public.non_conformites (tenant_id, reference, intitule, description, date_constat, origine, gravite, type, statut, causes_identifiees) values
 (${q(T)}, 'NC-D-001', 'Livrable remis en retard', 'Rapport final livré avec 5 jours de retard', current_date - 25, 'client', 'majeure', 'reclamation_client', 'analysee',
   ${j({ methode: "5_pourquoi", probleme: "Retard livrable", pourquoi: ["Sous-estimation charge", "Absence de jalon intermédiaire"], cause_racine: "Planification insuffisante" })}),
 (${q(T)}, 'NC-D-002', 'Document non à jour', 'Procédure obsolète utilisée en mission', current_date - 15, 'audit_interne', 'mineure', 'nc_processus', 'ouverte', '[]'::jsonb),
 (${q(T)}, 'NC-D-003', 'Erreur de facturation', 'Montant erroné sur une facture', current_date - 40, 'collaborateur', 'mineure', 'nc_processus', 'cloturee', '[]'::jsonb);

-- 14) Réclamations
insert into public.reclamations (tenant_id, objet, client, date_reception, canal, description, statut) values
 (${q(T)}, 'Retard de livraison', 'Client Alpha', current_date - 24, 'mail', 'Mécontentement sur le délai', 'cloturee'),
 (${q(T)}, 'Qualité du livrable', 'Client Beta', current_date - 8, 'tel', 'Demande de reprise partielle', 'recue'),
 (${q(T)}, 'Disponibilité consultant', 'Client Gamma', current_date - 3, 'mail', 'Consultant peu joignable', 'recue');

-- 15) Audits
insert into public.audits_internes (tenant_id, reference, type_audit, perimetre, date_prevue, date_realisee, statut, ecarts_constates) values
 (${q(T)}, 'AI-D-001', 'interne', 'Processus Réalisation', current_date - 35, current_date - 30, 'cloture', '2 écarts mineurs, 1 piste de progrès'),
 (${q(T)}, 'AE-D-001', 'externe', 'Audit de surveillance ISO 9001', current_date + 40, null, 'planifie', null);

-- 16) Enquêtes de satisfaction (NPS)
insert into public.enquetes_satisfaction (tenant_id, client, date_reponse, note_recommandation, note_satisfaction, source) values
 (${q(T)}, 'Client Alpha', current_date - 30, 9, 9, 'enquete'),
 (${q(T)}, 'Client Beta', current_date - 28, 10, 9, 'enquete'),
 (${q(T)}, 'Client Gamma', current_date - 20, 7, 7, 'enquete'),
 (${q(T)}, 'Client Delta', current_date - 15, 8, 8, 'enquete'),
 (${q(T)}, 'Client Epsilon', current_date - 10, 5, 6, 'enquete'),
 (${q(T)}, 'Client Zeta', current_date - 5, 9, 8, 'enquete');

-- 17) Fournisseurs
insert into public.fournisseurs (tenant_id, nom, categorie, criticite, note_evaluation, date_evaluation, prochaine_evaluation, statut) values
 (${q(T)}, 'Hébergeur Cloud', 'Infrastructure', 'critique', 4, current_date - 90, current_date - 5, 'actif'),
 (${q(T)}, 'Cabinet de recrutement', 'RH', 'moyenne', 3, current_date - 120, current_date + 60, 'actif'),
 (${q(T)}, 'Organisme de formation', 'Formation', 'faible', 5, current_date - 60, current_date + 120, 'actif');

-- 18) Communications
insert into public.communications (tenant_id, sujet, type, canal, audience, statut, date_prevue) values
 (${q(T)}, 'Diffusion de la politique qualité', 'note_interne', 'email', 'Tous', 'realisee', current_date - 18),
 (${q(T)}, 'Rappel sécurité informatique', 'note_interne', 'intranet', 'Tous', 'realisee', current_date - 7),
 (${q(T)}, 'Préparation audit de surveillance', 'reunion', 'reunion', 'Encadrement', 'planifiee', current_date + 30);

-- 19) Consultants + suivi (eNPS)
insert into public.consultants (tenant_id, nom, prenom, poste, date_demarrage, odm, pdp, visite_medicale) values
 (${q(T)}, 'Bernard', 'Alice', 'Consultante senior', current_date - 400, true, true, true),
 (${q(T)}, 'Petit', 'Marc', 'Consultant', current_date - 200, true, false, true),
 (${q(T)}, 'Roux', 'Sophie', 'Consultante', current_date - 90, true, true, false),
 (${q(T)}, 'Moreau', 'Lucas', 'Consultant junior', current_date - 30, false, false, false);
insert into public.suivis_consultant (tenant_id, nom, client, poste, satisfaction_globale, note_qualite_suivi_manager, nps, alerte) values
 (${q(T)}, 'Alice Bernard', 'Client Alpha', 'Consultante senior', 5, 4, 9, false),
 (${q(T)}, 'Marc Petit', 'Client Beta', 'Consultant', 4, 4, 8, false),
 (${q(T)}, 'Sophie Roux', 'Client Gamma', 'Consultante', 4, 5, 9, false),
 (${q(T)}, 'Lucas Moreau', 'Client Delta', 'Consultant junior', 3, 3, 6, true);

-- 20) Documents maîtrisés
insert into public.documents_maitrise (tenant_id, code, titre, type, version, statut, date_revision_prevue, processus_id) values
 (${q(T)}, 'MAN-001', 'Manuel qualité', 'manuel', 'A', 'en_vigueur', current_date + 200, ${q(P[0])}),
 (${q(T)}, 'ENR-001', 'Trame de compte rendu de mission', 'formulaire', 'B', 'en_vigueur', current_date + 30, ${q(P[2])}),
 (${q(T)}, 'INS-001', 'Instruction sécurité postes', 'instruction', 'A', 'en_vigueur', current_date - 10, ${q(P[5])});

-- 21) Procédure
insert into public.procedures (tenant_id, code, titre, processus_id, statut, objet, domaine_application) values
 (${q(T)}, 'PR-001', 'Maîtrise des non-conformités', ${q(P[0])}, 'publiee', 'Décrire le traitement des non-conformités', 'Toutes les missions');

-- 22) Veille réglementaire
insert into public.veille_reglementaire (tenant_id, intitule, date_publication, statut, impact_smq) values
 (${q(T)}, 'Directive NIS2', current_date - 120, 'a_analyser', 'Renforcement des exigences de sécurité'),
 (${q(T)}, 'Mise à jour RGPD (lignes directrices)', current_date - 60, 'analysee', 'Revue des durées de conservation');

-- 23) Réunion QHSE
insert into public.reunions (tenant_id, titre, type, date_prevue, date_realisation, lieu, animateur, objectifs, statut, points) values
 (${q(T)}, 'Comité qualité T3', 'comite_qhse', current_date - 10, current_date - 10, 'Visio', 'Léa Martin', 'Suivi du plan d''actions et des indicateurs', 'terminee',
  ${j([
    {
      sujet: "Revue des indicateurs",
      discussion: "Satisfaction en hausse",
      decision: "Maintenir le cap",
      statut: "traite",
    },
    {
      sujet: "Audit à venir",
      discussion: "Préparer les preuves",
      decision: "Lancer la collecte",
      statut: "a_voir",
    },
  ])});

commit;
select 'OK' as resultat, (select count(*) from public.processus where tenant_id = ${q(T)}) as processus, (select count(*) from public.actions where tenant_id = ${q(T)}) as actions;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const body = await res.text();
if (!res.ok) {
  console.error("❌ Échec du seed :", res.status, body);
  process.exit(1);
}
console.log("✅ Seed staging OK :", body);
console.log("\n— Connexion staging —");
console.log("URL      : https://staging.flowise.fr/login");
console.log("Email    :", EMAIL);
console.log("Password :", PASSWORD);
