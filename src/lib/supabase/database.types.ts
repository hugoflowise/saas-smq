export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          cause_fondamentale: string | null
          commentaires: string | null
          constat: string | null
          cotation: Database["public"]["Enums"]["cotation_conformite"] | null
          created_at: string
          created_by: string | null
          date_creation: string
          date_effective: string | null
          date_prevue: string | null
          deleted_at: string | null
          description_courte: string
          description_detail: string | null
          id: string
          indicateur_efficacite: string | null
          origine: Database["public"]["Enums"]["action_origine"]
          priorite: Database["public"]["Enums"]["action_priorite"]
          processus_concerne: string | null
          propose: boolean
          recommandation: string | null
          reference: string
          reference_iso: string[] | null
          responsable_id: string | null
          revue_id: string | null
          statut: Database["public"]["Enums"]["action_statut"]
          tenant_id: string
          type: Database["public"]["Enums"]["action_type"]
          updated_at: string
          updated_by: string | null
          valide_le: string | null
        }
        Insert: {
          cause_fondamentale?: string | null
          commentaires?: string | null
          constat?: string | null
          cotation?: Database["public"]["Enums"]["cotation_conformite"] | null
          created_at?: string
          created_by?: string | null
          date_creation?: string
          date_effective?: string | null
          date_prevue?: string | null
          deleted_at?: string | null
          description_courte: string
          description_detail?: string | null
          id?: string
          indicateur_efficacite?: string | null
          origine?: Database["public"]["Enums"]["action_origine"]
          priorite?: Database["public"]["Enums"]["action_priorite"]
          processus_concerne?: string | null
          propose?: boolean
          recommandation?: string | null
          reference: string
          reference_iso?: string[] | null
          responsable_id?: string | null
          revue_id?: string | null
          statut?: Database["public"]["Enums"]["action_statut"]
          tenant_id: string
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string
          updated_by?: string | null
          valide_le?: string | null
        }
        Update: {
          cause_fondamentale?: string | null
          commentaires?: string | null
          constat?: string | null
          cotation?: Database["public"]["Enums"]["cotation_conformite"] | null
          created_at?: string
          created_by?: string | null
          date_creation?: string
          date_effective?: string | null
          date_prevue?: string | null
          deleted_at?: string | null
          description_courte?: string
          description_detail?: string | null
          id?: string
          indicateur_efficacite?: string | null
          origine?: Database["public"]["Enums"]["action_origine"]
          priorite?: Database["public"]["Enums"]["action_priorite"]
          processus_concerne?: string | null
          propose?: boolean
          recommandation?: string | null
          reference?: string
          reference_iso?: string[] | null
          responsable_id?: string | null
          revue_id?: string | null
          statut?: Database["public"]["Enums"]["action_statut"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string
          updated_by?: string | null
          valide_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_processus_concerne_fkey"
            columns: ["processus_concerne"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_revue_id_fkey"
            columns: ["revue_id"]
            isOneToOne: false
            referencedRelation: "revues_direction"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_actions: {
        Row: {
          action_id: string
          audit_id: string
          created_at: string
          id: string
          tenant_id: string
        }
        Insert: {
          action_id: string
          audit_id: string
          created_at?: string
          id?: string
          tenant_id: string
        }
        Update: {
          action_id?: string
          audit_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_actions_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits_internes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_questions: {
        Row: {
          audit_id: string
          constat: string | null
          created_at: string
          id: string
          ordre: number
          question: string
          reference_iso: string | null
          reponse: Database["public"]["Enums"]["cotation_conformite"]
          tenant_id: string
        }
        Insert: {
          audit_id: string
          constat?: string | null
          created_at?: string
          id?: string
          ordre?: number
          question: string
          reference_iso?: string | null
          reponse?: Database["public"]["Enums"]["cotation_conformite"]
          tenant_id: string
        }
        Update: {
          audit_id?: string
          constat?: string | null
          created_at?: string
          id?: string
          ordre?: number
          question?: string
          reference_iso?: string | null
          reponse?: Database["public"]["Enums"]["cotation_conformite"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_questions_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits_internes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audits_internes: {
        Row: {
          auditeur_id: string | null
          created_at: string
          created_by: string | null
          date_prevue: string | null
          date_realisee: string | null
          deleted_at: string | null
          duree_prevue: number | null
          ecarts_constates: string | null
          id: string
          organisme: string | null
          perimetre: string | null
          processus_audites: string[] | null
          rapport: string | null
          reference: string
          statut: Database["public"]["Enums"]["audit_statut"]
          tenant_id: string
          type_audit: Database["public"]["Enums"]["audit_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auditeur_id?: string | null
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisee?: string | null
          deleted_at?: string | null
          duree_prevue?: number | null
          ecarts_constates?: string | null
          id?: string
          organisme?: string | null
          perimetre?: string | null
          processus_audites?: string[] | null
          rapport?: string | null
          reference: string
          statut?: Database["public"]["Enums"]["audit_statut"]
          tenant_id: string
          type_audit?: Database["public"]["Enums"]["audit_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auditeur_id?: string | null
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisee?: string | null
          deleted_at?: string | null
          duree_prevue?: number | null
          ecarts_constates?: string | null
          id?: string
          organisme?: string | null
          perimetre?: string | null
          processus_audites?: string[] | null
          rapport?: string | null
          reference?: string
          statut?: Database["public"]["Enums"]["audit_statut"]
          tenant_id?: string
          type_audit?: Database["public"]["Enums"]["audit_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_internes_auditeur_id_fkey"
            columns: ["auditeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_internes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_internes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_internes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cartographie_versions: {
        Row: {
          created_at: string
          id: string
          published_by: string | null
          snapshot: Json | null
          tenant_id: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_by?: string | null
          snapshot?: Json | null
          tenant_id: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          published_by?: string | null
          snapshot?: Json | null
          tenant_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartographie_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartographie_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_modeles: {
        Row: {
          categorie: string
          corps: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          objet: string
          tenant_id: string
          titre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          categorie?: string
          corps?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          objet: string
          tenant_id: string
          titre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          categorie?: string
          corps?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          objet?: string
          tenant_id?: string
          titre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_modeles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_modeles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_modeles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          audience: string | null
          canal: Database["public"]["Enums"]["communication_canal"]
          created_at: string
          created_by: string | null
          date_prevue: string | null
          date_realisee: string | null
          deleted_at: string | null
          id: string
          message: string | null
          statut: Database["public"]["Enums"]["communication_statut"]
          sujet: string
          tenant_id: string
          type: Database["public"]["Enums"]["communication_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience?: string | null
          canal?: Database["public"]["Enums"]["communication_canal"]
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisee?: string | null
          deleted_at?: string | null
          id?: string
          message?: string | null
          statut?: Database["public"]["Enums"]["communication_statut"]
          sujet: string
          tenant_id: string
          type?: Database["public"]["Enums"]["communication_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string | null
          canal?: Database["public"]["Enums"]["communication_canal"]
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisee?: string | null
          deleted_at?: string | null
          id?: string
          message?: string | null
          statut?: Database["public"]["Enums"]["communication_statut"]
          sujet?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["communication_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conformite_evaluation: {
        Row: {
          commentaire: string | null
          cotation: Database["public"]["Enums"]["cotation_conformite"]
          created_at: string
          date_evaluation: string | null
          evaluateur_id: string | null
          id: string
          preuves_liees: Json | null
          referentiel_iso_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          commentaire?: string | null
          cotation?: Database["public"]["Enums"]["cotation_conformite"]
          created_at?: string
          date_evaluation?: string | null
          evaluateur_id?: string | null
          id?: string
          preuves_liees?: Json | null
          referentiel_iso_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commentaire?: string | null
          cotation?: Database["public"]["Enums"]["cotation_conformite"]
          created_at?: string
          date_evaluation?: string | null
          evaluateur_id?: string | null
          id?: string
          preuves_liees?: Json | null
          referentiel_iso_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conformite_evaluation_evaluateur_id_fkey"
            columns: ["evaluateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformite_evaluation_referentiel_iso_id_fkey"
            columns: ["referentiel_iso_id"]
            isOneToOne: false
            referencedRelation: "referentiel_iso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformite_evaluation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consultants: {
        Row: {
          created_at: string
          created_by: string | null
          date_demarrage: string | null
          date_fin: string | null
          deleted_at: string | null
          entite: string | null
          id: string
          nom: string
          odm: boolean
          pdp: boolean
          poste: string | null
          prenom: string | null
          reference: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          visite_medicale: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_demarrage?: string | null
          date_fin?: string | null
          deleted_at?: string | null
          entite?: string | null
          id?: string
          nom: string
          odm?: boolean
          pdp?: boolean
          poste?: string | null
          prenom?: string | null
          reference?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          visite_medicale?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_demarrage?: string | null
          date_fin?: string | null
          deleted_at?: string | null
          entite?: string | null
          id?: string
          nom?: string
          odm?: boolean
          pdp?: boolean
          poste?: string | null
          prenom?: string | null
          reference?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          visite_medicale?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "consultants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultants_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contexte_organisme: {
        Row: {
          analyse_pestel: Json | null
          analyse_swot: Json | null
          created_at: string
          date_revue: string | null
          id: string
          prochain_revue: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          analyse_pestel?: Json | null
          analyse_swot?: Json | null
          created_at?: string
          date_revue?: string | null
          id?: string
          prochain_revue?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          analyse_pestel?: Json | null
          analyse_swot?: Json | null
          created_at?: string
          date_revue?: string | null
          id?: string
          prochain_revue?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contexte_organisme_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contexte_organisme_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_maitrise: {
        Row: {
          approbateur: string | null
          code: string | null
          commentaire: string | null
          created_at: string
          created_by: string | null
          date_approbation: string | null
          date_revision_prevue: string | null
          deleted_at: string | null
          duree_conservation: string | null
          emplacement: string | null
          fichier_nom: string | null
          fichier_path: string | null
          fichier_taille: number | null
          id: string
          processus_id: string | null
          redacteur: string | null
          statut: Database["public"]["Enums"]["doc_maitrise_statut"]
          tenant_id: string
          titre: string
          type: Database["public"]["Enums"]["doc_maitrise_type"]
          updated_at: string
          updated_by: string | null
          version: string | null
        }
        Insert: {
          approbateur?: string | null
          code?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_approbation?: string | null
          date_revision_prevue?: string | null
          deleted_at?: string | null
          duree_conservation?: string | null
          emplacement?: string | null
          fichier_nom?: string | null
          fichier_path?: string | null
          fichier_taille?: number | null
          id?: string
          processus_id?: string | null
          redacteur?: string | null
          statut?: Database["public"]["Enums"]["doc_maitrise_statut"]
          tenant_id: string
          titre: string
          type?: Database["public"]["Enums"]["doc_maitrise_type"]
          updated_at?: string
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          approbateur?: string | null
          code?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_approbation?: string | null
          date_revision_prevue?: string | null
          deleted_at?: string | null
          duree_conservation?: string | null
          emplacement?: string | null
          fichier_nom?: string | null
          fichier_path?: string | null
          fichier_taille?: number | null
          id?: string
          processus_id?: string | null
          redacteur?: string | null
          statut?: Database["public"]["Enums"]["doc_maitrise_statut"]
          tenant_id?: string
          titre?: string
          type?: Database["public"]["Enums"]["doc_maitrise_type"]
          updated_at?: string
          updated_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_maitrise_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_maitrise_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_maitrise_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_maitrise_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domaine_application: {
        Row: {
          created_at: string
          date_etablissement: string | null
          exclusions: Json
          id: string
          perimetre: string | null
          prochaine_revue: string | null
          sites: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          valide_le: string | null
          valide_par: string | null
        }
        Insert: {
          created_at?: string
          date_etablissement?: string | null
          exclusions?: Json
          id?: string
          perimetre?: string | null
          prochaine_revue?: string | null
          sites?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          valide_le?: string | null
          valide_par?: string | null
        }
        Update: {
          created_at?: string
          date_etablissement?: string | null
          exclusions?: Json
          id?: string
          perimetre?: string | null
          prochaine_revue?: string | null
          sites?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          valide_le?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domaine_application_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domaine_application_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domaine_application_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enquetes_satisfaction: {
        Row: {
          client: string | null
          commentaire: string | null
          created_at: string
          created_by: string | null
          date_reponse: string
          deleted_at: string | null
          est_reclamation: boolean
          id: string
          note_recommandation: number | null
          note_satisfaction: number | null
          source: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_reponse?: string
          deleted_at?: string | null
          est_reclamation?: boolean
          id?: string
          note_recommandation?: number | null
          note_satisfaction?: number | null
          source?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_reponse?: string
          deleted_at?: string | null
          est_reclamation?: boolean
          id?: string
          note_recommandation?: number | null
          note_satisfaction?: number | null
          source?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquetes_satisfaction_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquetes_satisfaction_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquetes_satisfaction_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements_qualite: {
        Row: {
          created_at: string
          created_by: string | null
          date_evenement: string
          deleted_at: string | null
          description: string | null
          id: string
          tenant_id: string
          titre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_evenement: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          tenant_id: string
          titre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_evenement?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          tenant_id?: string
          titre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evenements_qualite_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_qualite_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_qualite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fournisseurs: {
        Row: {
          categorie: string | null
          commentaire: string | null
          contact: string | null
          created_at: string
          created_by: string | null
          criticite: Database["public"]["Enums"]["fournisseur_criticite"]
          date_evaluation: string | null
          deleted_at: string | null
          id: string
          nom: string
          note_evaluation: number | null
          prochaine_evaluation: string | null
          statut: Database["public"]["Enums"]["fournisseur_statut"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          categorie?: string | null
          commentaire?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          criticite?: Database["public"]["Enums"]["fournisseur_criticite"]
          date_evaluation?: string | null
          deleted_at?: string | null
          id?: string
          nom: string
          note_evaluation?: number | null
          prochaine_evaluation?: string | null
          statut?: Database["public"]["Enums"]["fournisseur_statut"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          categorie?: string | null
          commentaire?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          criticite?: Database["public"]["Enums"]["fournisseur_criticite"]
          date_evaluation?: string | null
          deleted_at?: string | null
          id?: string
          nom?: string
          note_evaluation?: number | null
          prochaine_evaluation?: string | null
          statut?: Database["public"]["Enums"]["fournisseur_statut"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fournisseurs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fournisseurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fournisseurs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      indicateurs: {
        Row: {
          boond_endpoint: string | null
          cible: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          formule_calcul: string | null
          frequence_mesure: Database["public"]["Enums"]["indicateur_frequence"]
          id: string
          nom: string
          processus_id: string | null
          sens: Database["public"]["Enums"]["objectif_sens"]
          seuil_alerte_max: number | null
          seuil_alerte_min: number | null
          source: Database["public"]["Enums"]["indicateur_source"]
          tenant_id: string
          type: Database["public"]["Enums"]["indicateur_type"]
          unite: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          boond_endpoint?: string | null
          cible?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          formule_calcul?: string | null
          frequence_mesure?: Database["public"]["Enums"]["indicateur_frequence"]
          id?: string
          nom: string
          processus_id?: string | null
          sens?: Database["public"]["Enums"]["objectif_sens"]
          seuil_alerte_max?: number | null
          seuil_alerte_min?: number | null
          source?: Database["public"]["Enums"]["indicateur_source"]
          tenant_id: string
          type?: Database["public"]["Enums"]["indicateur_type"]
          unite?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          boond_endpoint?: string | null
          cible?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          formule_calcul?: string | null
          frequence_mesure?: Database["public"]["Enums"]["indicateur_frequence"]
          id?: string
          nom?: string
          processus_id?: string | null
          sens?: Database["public"]["Enums"]["objectif_sens"]
          seuil_alerte_max?: number | null
          seuil_alerte_min?: number | null
          source?: Database["public"]["Enums"]["indicateur_source"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["indicateur_type"]
          unite?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicateurs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicateurs_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicateurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicateurs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      indicateurs_valeurs: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string | null
          date_mesure: string
          id: string
          indicateur_id: string
          source_donnees: Json | null
          tenant_id: string
          valeur: number
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_mesure?: string
          id?: string
          indicateur_id: string
          source_donnees?: Json | null
          tenant_id: string
          valeur: number
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_mesure?: string
          id?: string
          indicateur_id?: string
          source_donnees?: Json | null
          tenant_id?: string
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicateurs_valeurs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicateurs_valeurs_indicateur_id_fkey"
            columns: ["indicateur_id"]
            isOneToOne: false
            referencedRelation: "indicateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicateurs_valeurs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jalons_certification: {
        Row: {
          created_at: string
          created_by: string | null
          date_jalon: string | null
          deleted_at: string | null
          description: string | null
          id: string
          libelle: string
          statut: Database["public"]["Enums"]["jalon_statut"]
          tenant_id: string
          type: Database["public"]["Enums"]["jalon_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_jalon?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          libelle: string
          statut?: Database["public"]["Enums"]["jalon_statut"]
          tenant_id: string
          type?: Database["public"]["Enums"]["jalon_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_jalon?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          libelle?: string
          statut?: Database["public"]["Enums"]["jalon_statut"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["jalon_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jalons_certification_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jalons_certification_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jalons_certification_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nc_actions: {
        Row: {
          action_id: string
          created_at: string
          id: string
          nc_id: string
          tenant_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          nc_id: string
          tenant_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          nc_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nc_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nc_actions_nc_id_fkey"
            columns: ["nc_id"]
            isOneToOne: false
            referencedRelation: "non_conformites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nc_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      non_conformites: {
        Row: {
          causes_identifiees: Json | null
          created_at: string
          created_by: string | null
          date_cloture: string | null
          date_constat: string
          deleted_at: string | null
          description: string | null
          gravite: Database["public"]["Enums"]["nc_gravite"]
          id: string
          intitule: string
          origine: Database["public"]["Enums"]["nc_origine"]
          origine_detail: string | null
          processus_concerne: string | null
          reference: string
          responsable_traitement: string | null
          statut: Database["public"]["Enums"]["nc_statut"]
          tenant_id: string
          type: Database["public"]["Enums"]["nc_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          causes_identifiees?: Json | null
          created_at?: string
          created_by?: string | null
          date_cloture?: string | null
          date_constat?: string
          deleted_at?: string | null
          description?: string | null
          gravite?: Database["public"]["Enums"]["nc_gravite"]
          id?: string
          intitule: string
          origine?: Database["public"]["Enums"]["nc_origine"]
          origine_detail?: string | null
          processus_concerne?: string | null
          reference: string
          responsable_traitement?: string | null
          statut?: Database["public"]["Enums"]["nc_statut"]
          tenant_id: string
          type?: Database["public"]["Enums"]["nc_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          causes_identifiees?: Json | null
          created_at?: string
          created_by?: string | null
          date_cloture?: string | null
          date_constat?: string
          deleted_at?: string | null
          description?: string | null
          gravite?: Database["public"]["Enums"]["nc_gravite"]
          id?: string
          intitule?: string
          origine?: Database["public"]["Enums"]["nc_origine"]
          origine_detail?: string | null
          processus_concerne?: string | null
          reference?: string
          responsable_traitement?: string | null
          statut?: Database["public"]["Enums"]["nc_statut"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["nc_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "non_conformites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformites_processus_concerne_fkey"
            columns: ["processus_concerne"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformites_responsable_traitement_fkey"
            columns: ["responsable_traitement"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_conformites_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          recipient_user_id: string
          tenant_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          recipient_user_id: string
          tenant_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          recipient_user_id?: string
          tenant_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      objectifs_qualite: {
        Row: {
          cible_chiffree: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          echeance: string | null
          est_smart: boolean
          fonction_concernee: string | null
          id: string
          indicateur_id: string | null
          intitule: string
          processus_id: string | null
          responsable_id: string | null
          sens: Database["public"]["Enums"]["objectif_sens"]
          statut: Database["public"]["Enums"]["objectif_statut"]
          tenant_id: string
          unite: string | null
          updated_at: string
          updated_by: string | null
          valeur_actuelle: number | null
          valeur_cible: number | null
        }
        Insert: {
          cible_chiffree?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          echeance?: string | null
          est_smart?: boolean
          fonction_concernee?: string | null
          id?: string
          indicateur_id?: string | null
          intitule: string
          processus_id?: string | null
          responsable_id?: string | null
          sens?: Database["public"]["Enums"]["objectif_sens"]
          statut?: Database["public"]["Enums"]["objectif_statut"]
          tenant_id: string
          unite?: string | null
          updated_at?: string
          updated_by?: string | null
          valeur_actuelle?: number | null
          valeur_cible?: number | null
        }
        Update: {
          cible_chiffree?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          echeance?: string | null
          est_smart?: boolean
          fonction_concernee?: string | null
          id?: string
          indicateur_id?: string | null
          intitule?: string
          processus_id?: string | null
          responsable_id?: string | null
          sens?: Database["public"]["Enums"]["objectif_sens"]
          statut?: Database["public"]["Enums"]["objectif_statut"]
          tenant_id?: string
          unite?: string | null
          updated_at?: string
          updated_by?: string | null
          valeur_actuelle?: number | null
          valeur_cible?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "objectifs_qualite_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_qualite_indicateur_id_fkey"
            columns: ["indicateur_id"]
            isOneToOne: false
            referencedRelation: "indicateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_qualite_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_qualite_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_qualite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectifs_qualite_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parties_interessees: {
        Row: {
          attentes: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          exigences: string | null
          id: string
          legitimite: number
          niveau_influence: Database["public"]["Enums"]["pi_influence"]
          niveau_interaction: Database["public"]["Enums"]["pi_interaction"]
          nom: string
          pouvoir: number
          propose: boolean
          sphere: Database["public"]["Enums"]["pi_sphere"]
          tenant_id: string
          type: Database["public"]["Enums"]["pi_type"]
          updated_at: string
          updated_by: string | null
          urgence: number
          valide_le: string | null
        }
        Insert: {
          attentes?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exigences?: string | null
          id?: string
          legitimite?: number
          niveau_influence?: Database["public"]["Enums"]["pi_influence"]
          niveau_interaction?: Database["public"]["Enums"]["pi_interaction"]
          nom: string
          pouvoir?: number
          propose?: boolean
          sphere?: Database["public"]["Enums"]["pi_sphere"]
          tenant_id: string
          type?: Database["public"]["Enums"]["pi_type"]
          updated_at?: string
          updated_by?: string | null
          urgence?: number
          valide_le?: string | null
        }
        Update: {
          attentes?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exigences?: string | null
          id?: string
          legitimite?: number
          niveau_influence?: Database["public"]["Enums"]["pi_influence"]
          niveau_interaction?: Database["public"]["Enums"]["pi_interaction"]
          nom?: string
          pouvoir?: number
          propose?: boolean
          sphere?: Database["public"]["Enums"]["pi_sphere"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["pi_type"]
          updated_at?: string
          updated_by?: string | null
          urgence?: number
          valide_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_interessees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_interessees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_interessees_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pi_attentes: {
        Row: {
          action: string | null
          attente: string
          commentaire: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          integration_pa: boolean
          maitrise: Database["public"]["Enums"]["pi_maitrise"]
          moyens_maitrise: string | null
          opportunite: string | null
          ordre: number
          partie_id: string
          processus_id: string | null
          risque: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action?: string | null
          attente: string
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          integration_pa?: boolean
          maitrise?: Database["public"]["Enums"]["pi_maitrise"]
          moyens_maitrise?: string | null
          opportunite?: string | null
          ordre?: number
          partie_id: string
          processus_id?: string | null
          risque?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action?: string | null
          attente?: string
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          integration_pa?: boolean
          maitrise?: Database["public"]["Enums"]["pi_maitrise"]
          moyens_maitrise?: string | null
          opportunite?: string | null
          ordre?: number
          partie_id?: string
          processus_id?: string | null
          risque?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pi_attentes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pi_attentes_partie_id_fkey"
            columns: ["partie_id"]
            isOneToOne: false
            referencedRelation: "parties_interessees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pi_attentes_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pi_attentes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pi_attentes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      politique_qualite: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string | null
          contenu: Json | null
          created_at: string
          created_by: string | null
          date_revision_prevue: string | null
          id: string
          signature_data: Json | null
          soumis_le: string | null
          soumis_par: string | null
          statut: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
          version_actuelle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          date_revision_prevue?: string | null
          id?: string
          signature_data?: Json | null
          soumis_le?: string | null
          soumis_par?: string | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          version_actuelle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          date_revision_prevue?: string | null
          id?: string
          signature_data?: Json | null
          soumis_le?: string | null
          soumis_par?: string | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          version_actuelle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "politique_qualite_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politique_qualite_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politique_qualite_soumis_par_fkey"
            columns: ["soumis_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politique_qualite_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politique_qualite_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      politique_qualite_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contenu_snapshot: Json | null
          created_at: string
          id: string
          pdf_url: string | null
          politique_id: string
          signature_data: Json | null
          tenant_id: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contenu_snapshot?: Json | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          politique_id: string
          signature_data?: Json | null
          tenant_id: string
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contenu_snapshot?: Json | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          politique_id?: string
          signature_data?: Json | null
          tenant_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "politique_qualite_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politique_qualite_versions_politique_id_fkey"
            columns: ["politique_id"]
            isOneToOne: false
            referencedRelation: "politique_qualite"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "politique_qualite_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string | null
          contenu: Json | null
          created_at: string
          created_by: string | null
          date_revision_prevue: string | null
          definitions: Json
          deleted_at: string | null
          description_courte: string | null
          diffusion: string | null
          domaine_application: string | null
          glossaire_abreviations: string | null
          glossaire_sigles: string | null
          glossaire_symboles: string | null
          id: string
          logigramme_svg: string | null
          logigramme_xml: string | null
          note_revision: string | null
          objet: string | null
          pilote_id: string | null
          processus_id: string | null
          redacteur: string | null
          reference_iso: string[] | null
          references_appli: Json
          references_doc: Json
          resume: string | null
          signature_data: Json | null
          soumis_le: string | null
          soumis_par: string | null
          statut: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          titre: string
          updated_at: string
          updated_by: string | null
          verificateur: string | null
          version_actuelle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          date_revision_prevue?: string | null
          definitions?: Json
          deleted_at?: string | null
          description_courte?: string | null
          diffusion?: string | null
          domaine_application?: string | null
          glossaire_abreviations?: string | null
          glossaire_sigles?: string | null
          glossaire_symboles?: string | null
          id?: string
          logigramme_svg?: string | null
          logigramme_xml?: string | null
          note_revision?: string | null
          objet?: string | null
          pilote_id?: string | null
          processus_id?: string | null
          redacteur?: string | null
          reference_iso?: string[] | null
          references_appli?: Json
          references_doc?: Json
          resume?: string | null
          signature_data?: Json | null
          soumis_le?: string | null
          soumis_par?: string | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          titre: string
          updated_at?: string
          updated_by?: string | null
          verificateur?: string | null
          version_actuelle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          date_revision_prevue?: string | null
          definitions?: Json
          deleted_at?: string | null
          description_courte?: string | null
          diffusion?: string | null
          domaine_application?: string | null
          glossaire_abreviations?: string | null
          glossaire_sigles?: string | null
          glossaire_symboles?: string | null
          id?: string
          logigramme_svg?: string | null
          logigramme_xml?: string | null
          note_revision?: string | null
          objet?: string | null
          pilote_id?: string | null
          processus_id?: string | null
          redacteur?: string | null
          reference_iso?: string[] | null
          references_appli?: Json
          references_doc?: Json
          resume?: string | null
          signature_data?: Json | null
          soumis_le?: string | null
          soumis_par?: string | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id?: string
          titre?: string
          updated_at?: string
          updated_by?: string | null
          verificateur?: string | null
          version_actuelle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_pilote_id_fkey"
            columns: ["pilote_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_soumis_par_fkey"
            columns: ["soumis_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contenu_snapshot: Json | null
          created_at: string
          id: string
          note_revision: string | null
          pdf_url: string | null
          procedure_id: string
          redacteur: string | null
          sections_snapshot: Json | null
          signature_data: Json | null
          tenant_id: string
          verificateur: string | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contenu_snapshot?: Json | null
          created_at?: string
          id?: string
          note_revision?: string | null
          pdf_url?: string | null
          procedure_id: string
          redacteur?: string | null
          sections_snapshot?: Json | null
          signature_data?: Json | null
          tenant_id: string
          verificateur?: string | null
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contenu_snapshot?: Json | null
          created_at?: string
          id?: string
          note_revision?: string | null
          pdf_url?: string | null
          procedure_id?: string
          redacteur?: string | null
          sections_snapshot?: Json | null
          signature_data?: Json | null
          tenant_id?: string
          verificateur?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_versions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      processus: {
        Row: {
          created_at: string
          created_by: string | null
          date_derniere_revue: string | null
          date_prochaine_revue: string | null
          deleted_at: string | null
          description: string | null
          entrees: string | null
          fiche_approuvee_le: string | null
          fiche_approuvee_par: string | null
          fiche_note_revision: string | null
          fiche_publiee_le: string | null
          fiche_redacteur: string | null
          fiche_redige_le: string | null
          fiche_redige_par: string | null
          fiche_reference: string | null
          fiche_signature: Json | null
          fiche_soumis_le: string | null
          fiche_soumis_par: string | null
          fiche_statut: Database["public"]["Enums"]["document_statut"]
          fiche_verificateur: string | null
          fiche_version: string | null
          finalite: string | null
          id: string
          intitule_long: string | null
          nom: string
          ordre_affichage: number
          perimetre: string | null
          pilote_id: string | null
          pilote_nom: string | null
          propose: boolean
          referentiels: string | null
          ressources_associees: string | null
          ressources_documentaires: string | null
          ressources_financieres: string | null
          ressources_humaines: string | null
          ressources_logicielles: string | null
          ressources_materielles: string | null
          sorties: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["processus_type"]
          updated_at: string
          updated_by: string | null
          valide_le: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_derniere_revue?: string | null
          date_prochaine_revue?: string | null
          deleted_at?: string | null
          description?: string | null
          entrees?: string | null
          fiche_approuvee_le?: string | null
          fiche_approuvee_par?: string | null
          fiche_note_revision?: string | null
          fiche_publiee_le?: string | null
          fiche_redacteur?: string | null
          fiche_redige_le?: string | null
          fiche_redige_par?: string | null
          fiche_reference?: string | null
          fiche_signature?: Json | null
          fiche_soumis_le?: string | null
          fiche_soumis_par?: string | null
          fiche_statut?: Database["public"]["Enums"]["document_statut"]
          fiche_verificateur?: string | null
          fiche_version?: string | null
          finalite?: string | null
          id?: string
          intitule_long?: string | null
          nom: string
          ordre_affichage?: number
          perimetre?: string | null
          pilote_id?: string | null
          pilote_nom?: string | null
          propose?: boolean
          referentiels?: string | null
          ressources_associees?: string | null
          ressources_documentaires?: string | null
          ressources_financieres?: string | null
          ressources_humaines?: string | null
          ressources_logicielles?: string | null
          ressources_materielles?: string | null
          sorties?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["processus_type"]
          updated_at?: string
          updated_by?: string | null
          valide_le?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_derniere_revue?: string | null
          date_prochaine_revue?: string | null
          deleted_at?: string | null
          description?: string | null
          entrees?: string | null
          fiche_approuvee_le?: string | null
          fiche_approuvee_par?: string | null
          fiche_note_revision?: string | null
          fiche_publiee_le?: string | null
          fiche_redacteur?: string | null
          fiche_redige_le?: string | null
          fiche_redige_par?: string | null
          fiche_reference?: string | null
          fiche_signature?: Json | null
          fiche_soumis_le?: string | null
          fiche_soumis_par?: string | null
          fiche_statut?: Database["public"]["Enums"]["document_statut"]
          fiche_verificateur?: string | null
          fiche_version?: string | null
          finalite?: string | null
          id?: string
          intitule_long?: string | null
          nom?: string
          ordre_affichage?: number
          perimetre?: string | null
          pilote_id?: string | null
          pilote_nom?: string | null
          propose?: boolean
          referentiels?: string | null
          ressources_associees?: string | null
          ressources_documentaires?: string | null
          ressources_financieres?: string | null
          ressources_humaines?: string | null
          ressources_logicielles?: string | null
          ressources_materielles?: string | null
          sorties?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["processus_type"]
          updated_at?: string
          updated_by?: string | null
          valide_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processus_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_approuvee_par_fkey"
            columns: ["fiche_approuvee_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_redige_par_fkey"
            columns: ["fiche_redige_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_soumis_par_fkey"
            columns: ["fiche_soumis_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_pilote_id_fkey"
            columns: ["pilote_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processus_activites: {
        Row: {
          activite: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          ordre: number
          processus_id: string
          responsable: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activite: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          ordre?: number
          processus_id: string
          responsable?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activite?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          ordre?: number
          processus_id?: string
          responsable?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processus_activites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_activites_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_activites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_activites_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processus_fiche_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          processus_id: string
          redige_par: string | null
          signature_data: Json | null
          snapshot: Json | null
          soumis_par: string | null
          tenant_id: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          processus_id: string
          redige_par?: string | null
          signature_data?: Json | null
          snapshot?: Json | null
          soumis_par?: string | null
          tenant_id: string
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          processus_id?: string
          redige_par?: string | null
          signature_data?: Json | null
          snapshot?: Json | null
          soumis_par?: string | null
          tenant_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "processus_fiche_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_versions_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_versions_redige_par_fkey"
            columns: ["redige_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_versions_soumis_par_fkey"
            columns: ["soumis_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_fiche_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      processus_interactions: {
        Row: {
          client: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          fournisseur: string | null
          id: string
          nature: string | null
          ordre: number
          partenaire: string
          processus_id: string
          sens: Database["public"]["Enums"]["interaction_sens"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          fournisseur?: string | null
          id?: string
          nature?: string | null
          ordre?: number
          partenaire: string
          processus_id: string
          sens?: Database["public"]["Enums"]["interaction_sens"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          fournisseur?: string | null
          id?: string
          nature?: string | null
          ordre?: number
          partenaire?: string
          processus_id?: string
          sens?: Database["public"]["Enums"]["interaction_sens"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processus_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_interactions_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_interactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processus_pilotes: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          ordre: number
          pilote_id: string | null
          pilote_nom: string | null
          processus_id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          ordre?: number
          pilote_id?: string | null
          pilote_nom?: string | null
          processus_id: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          ordre?: number
          pilote_id?: string | null
          pilote_nom?: string | null
          processus_id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processus_pilotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_pilotes_pilote_id_fkey"
            columns: ["pilote_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_pilotes_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_pilotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processus_pilotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen: string | null
          must_set_password: boolean
          notification_preferences: Json
          role: Database["public"]["Enums"]["user_role"]
          signature_image: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_seen?: string | null
          must_set_password?: boolean
          notification_preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          signature_image?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_seen?: string | null
          must_set_password?: boolean
          notification_preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          signature_image?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      todos_perso: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          id: string
          texte: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          texte: string
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          texte?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_perso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamations: {
        Row: {
          action_id: string | null
          canal: Database["public"]["Enums"]["reclamation_canal"]
          client: string | null
          created_at: string
          created_by: string | null
          date_reception: string
          date_reponse: string | null
          deleted_at: string | null
          description: string | null
          gravite: Database["public"]["Enums"]["nc_gravite"]
          id: string
          nc_associee: string | null
          objet: string
          satisfait_client: boolean | null
          statut: Database["public"]["Enums"]["reclamation_statut"]
          tenant_id: string
          traitement: string | null
          type: Database["public"]["Enums"]["remontee_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_id?: string | null
          canal?: Database["public"]["Enums"]["reclamation_canal"]
          client?: string | null
          created_at?: string
          created_by?: string | null
          date_reception?: string
          date_reponse?: string | null
          deleted_at?: string | null
          description?: string | null
          gravite?: Database["public"]["Enums"]["nc_gravite"]
          id?: string
          nc_associee?: string | null
          objet: string
          satisfait_client?: boolean | null
          statut?: Database["public"]["Enums"]["reclamation_statut"]
          tenant_id: string
          traitement?: string | null
          type?: Database["public"]["Enums"]["remontee_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_id?: string | null
          canal?: Database["public"]["Enums"]["reclamation_canal"]
          client?: string | null
          created_at?: string
          created_by?: string | null
          date_reception?: string
          date_reponse?: string | null
          deleted_at?: string | null
          description?: string | null
          gravite?: Database["public"]["Enums"]["nc_gravite"]
          id?: string
          nc_associee?: string | null
          objet?: string
          satisfait_client?: boolean | null
          statut?: Database["public"]["Enums"]["reclamation_statut"]
          tenant_id?: string
          traitement?: string | null
          type?: Database["public"]["Enums"]["remontee_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reclamations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamations_nc_associee_fkey"
            columns: ["nc_associee"]
            isOneToOne: false
            referencedRelation: "non_conformites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referentiel_iso: {
        Row: {
          chapitre: string
          description: string | null
          domaine: Database["public"]["Enums"]["domaine_iso"]
          est_obligatoire: boolean
          exigences: Json | null
          id: string
          intitule: string
          norme: string
          ordre_affichage: number
          preuves_attendues: string | null
          version: string
        }
        Insert: {
          chapitre: string
          description?: string | null
          domaine: Database["public"]["Enums"]["domaine_iso"]
          est_obligatoire?: boolean
          exigences?: Json | null
          id?: string
          intitule: string
          norme?: string
          ordre_affichage?: number
          preuves_attendues?: string | null
          version?: string
        }
        Update: {
          chapitre?: string
          description?: string | null
          domaine?: Database["public"]["Enums"]["domaine_iso"]
          est_obligatoire?: boolean
          exigences?: Json | null
          id?: string
          intitule?: string
          norme?: string
          ordre_affichage?: number
          preuves_attendues?: string | null
          version?: string
        }
        Relationships: []
      }
      reunion_actions: {
        Row: {
          action_id: string
          created_at: string
          id: string
          reunion_id: string
          tenant_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          reunion_id: string
          tenant_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          reunion_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunion_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_actions_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      retours: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          note_admin: string | null
          numero: number
          page_url: string | null
          statut: Database["public"]["Enums"]["retour_statut"]
          tenant_id: string | null
          titre: string
          type: Database["public"]["Enums"]["retour_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          note_admin?: string | null
          numero?: number
          page_url?: string | null
          statut?: Database["public"]["Enums"]["retour_statut"]
          tenant_id?: string | null
          titre: string
          type?: Database["public"]["Enums"]["retour_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          note_admin?: string | null
          numero?: number
          page_url?: string | null
          statut?: Database["public"]["Enums"]["retour_statut"]
          tenant_id?: string | null
          titre?: string
          type?: Database["public"]["Enums"]["retour_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reunions: {
        Row: {
          animateur: string | null
          convoques: string | null
          created_at: string
          created_by: string | null
          date_prevue: string | null
          date_realisation: string | null
          deleted_at: string | null
          id: string
          lieu: string | null
          objectifs: string | null
          points: Json
          presents: string | null
          statut: Database["public"]["Enums"]["reunion_statut"]
          synthese: string | null
          tenant_id: string
          titre: string
          type: Database["public"]["Enums"]["reunion_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          animateur?: string | null
          convoques?: string | null
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisation?: string | null
          deleted_at?: string | null
          id?: string
          lieu?: string | null
          objectifs?: string | null
          points?: Json
          presents?: string | null
          statut?: Database["public"]["Enums"]["reunion_statut"]
          synthese?: string | null
          tenant_id: string
          titre: string
          type?: Database["public"]["Enums"]["reunion_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          animateur?: string | null
          convoques?: string | null
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisation?: string | null
          deleted_at?: string | null
          id?: string
          lieu?: string | null
          objectifs?: string | null
          points?: Json
          presents?: string | null
          statut?: Database["public"]["Enums"]["reunion_statut"]
          synthese?: string | null
          tenant_id?: string
          titre?: string
          type?: Database["public"]["Enums"]["reunion_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reunions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revues_direction: {
        Row: {
          annee: number
          approuve_par: string | null
          conclusions: string | null
          created_at: string
          created_by: string | null
          date_realisation: string | null
          decisions: string | null
          deleted_at: string | null
          donnees_capturees_le: string | null
          donnees_performance: Json | null
          entree_actions_anterieures: string | null
          entree_efficacite_actions: string | null
          entree_evolution_contexte: string | null
          entree_opportunites: string | null
          entree_performance_synthese: string | null
          entree_ressources: string | null
          id: string
          ordre_du_jour: string | null
          participants: Json
          points_specifiques: string | null
          sortie_amelioration: string | null
          sortie_changements: string | null
          sortie_ressources: string | null
          statut: Database["public"]["Enums"]["revue_statut"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          annee: number
          approuve_par?: string | null
          conclusions?: string | null
          created_at?: string
          created_by?: string | null
          date_realisation?: string | null
          decisions?: string | null
          deleted_at?: string | null
          donnees_capturees_le?: string | null
          donnees_performance?: Json | null
          entree_actions_anterieures?: string | null
          entree_efficacite_actions?: string | null
          entree_evolution_contexte?: string | null
          entree_opportunites?: string | null
          entree_performance_synthese?: string | null
          entree_ressources?: string | null
          id?: string
          ordre_du_jour?: string | null
          participants?: Json
          points_specifiques?: string | null
          sortie_amelioration?: string | null
          sortie_changements?: string | null
          sortie_ressources?: string | null
          statut?: Database["public"]["Enums"]["revue_statut"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          annee?: number
          approuve_par?: string | null
          conclusions?: string | null
          created_at?: string
          created_by?: string | null
          date_realisation?: string | null
          decisions?: string | null
          deleted_at?: string | null
          donnees_capturees_le?: string | null
          donnees_performance?: Json | null
          entree_actions_anterieures?: string | null
          entree_efficacite_actions?: string | null
          entree_evolution_contexte?: string | null
          entree_opportunites?: string | null
          entree_performance_synthese?: string | null
          entree_ressources?: string | null
          id?: string
          ordre_du_jour?: string | null
          participants?: Json
          points_specifiques?: string | null
          sortie_amelioration?: string | null
          sortie_changements?: string | null
          sortie_ressources?: string | null
          statut?: Database["public"]["Enums"]["revue_statut"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revues_direction_approuve_par_fkey"
            columns: ["approuve_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revues_direction_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revues_direction_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revues_direction_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risques_opportunites: {
        Row: {
          cause: string | null
          consequence: string | null
          created_at: string
          created_by: string | null
          criticite: number | null
          criticite_residuelle: number | null
          date_revue: string | null
          deleted_at: string | null
          gravite: number
          gravite_residuelle: number | null
          id: string
          intitule: string
          probabilite: number
          probabilite_residuelle: number | null
          processus_id: string | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["ro_statut"]
          tenant_id: string
          traitement_prevu: string | null
          type: Database["public"]["Enums"]["ro_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cause?: string | null
          consequence?: string | null
          created_at?: string
          created_by?: string | null
          criticite?: number | null
          criticite_residuelle?: number | null
          date_revue?: string | null
          deleted_at?: string | null
          gravite?: number
          gravite_residuelle?: number | null
          id?: string
          intitule: string
          probabilite?: number
          probabilite_residuelle?: number | null
          processus_id?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["ro_statut"]
          tenant_id: string
          traitement_prevu?: string | null
          type?: Database["public"]["Enums"]["ro_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cause?: string | null
          consequence?: string | null
          created_at?: string
          created_by?: string | null
          criticite?: number | null
          criticite_residuelle?: number | null
          date_revue?: string | null
          deleted_at?: string | null
          gravite?: number
          gravite_residuelle?: number | null
          id?: string
          intitule?: string
          probabilite?: number
          probabilite_residuelle?: number | null
          processus_id?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["ro_statut"]
          tenant_id?: string
          traitement_prevu?: string | null
          type?: Database["public"]["Enums"]["ro_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risques_opportunites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risques_opportunites_processus_id_fkey"
            columns: ["processus_id"]
            isOneToOne: false
            referencedRelation: "processus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risques_opportunites_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risques_opportunites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risques_opportunites_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ro_actions: {
        Row: {
          action_id: string
          created_at: string
          id: string
          ro_id: string
          tenant_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          ro_id: string
          tenant_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          ro_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ro_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ro_actions_ro_id_fkey"
            columns: ["ro_id"]
            isOneToOne: false
            referencedRelation: "risques_opportunites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ro_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suivis_consultant: {
        Row: {
          alerte: boolean
          besoin_accompagnement: boolean | null
          client: string | null
          coherence_odm: boolean | null
          created_at: string
          deleted_at: string | null
          email: string | null
          habilitations: boolean | null
          id: string
          nom: string | null
          note_qualite_suivi_manager: number | null
          nps: number | null
          poste: string | null
          reponses: Json
          satisfaction_globale: number | null
          secteur_nucleaire: boolean | null
          site_intervention: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alerte?: boolean
          besoin_accompagnement?: boolean | null
          client?: string | null
          coherence_odm?: boolean | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          habilitations?: boolean | null
          id?: string
          nom?: string | null
          note_qualite_suivi_manager?: number | null
          nps?: number | null
          poste?: string | null
          reponses?: Json
          satisfaction_globale?: number | null
          secteur_nucleaire?: boolean | null
          site_intervention?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alerte?: boolean
          besoin_accompagnement?: boolean | null
          client?: string | null
          coherence_odm?: boolean | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          habilitations?: boolean | null
          id?: string
          nom?: string | null
          note_qualite_suivi_manager?: number | null
          nps?: number | null
          poste?: string | null
          reponses?: Json
          satisfaction_globale?: number | null
          secteur_nucleaire?: boolean | null
          site_intervention?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suivis_consultant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suivis_prestation: {
        Row: {
          client: string | null
          consultant: string | null
          created_at: string
          date_suivi: string | null
          deleted_at: string | null
          est_reclamation: boolean
          id: string
          manager: string | null
          mission: string | null
          nouvelle_date_suivi: string | null
          nps: number | null
          reponses: Json
          satisfaction_globale: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client?: string | null
          consultant?: string | null
          created_at?: string
          date_suivi?: string | null
          deleted_at?: string | null
          est_reclamation?: boolean
          id?: string
          manager?: string | null
          mission?: string | null
          nouvelle_date_suivi?: string | null
          nps?: number | null
          reponses?: Json
          satisfaction_globale?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client?: string | null
          consultant?: string | null
          created_at?: string
          date_suivi?: string | null
          deleted_at?: string | null
          est_reclamation?: boolean
          id?: string
          manager?: string | null
          mission?: string | null
          nouvelle_date_suivi?: string | null
          nps?: number | null
          reponses?: Json
          satisfaction_globale?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suivis_prestation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          adresse: string | null
          boond_account_id: string | null
          boond_oauth_token: string | null
          bureau_etudes: boolean
          code_postal: string | null
          couleur_charte: string | null
          created_at: string
          date_souscription: string | null
          deleted_at: string | null
          effectif_tranche:
            | Database["public"]["Enums"]["effectif_tranche"]
            | null
          forme_juridique: string | null
          formule: Database["public"]["Enums"]["tenant_formule"]
          id: string
          ingest_token: string
          liste_diffusion: string | null
          logo_url: string | null
          mentions_legales: string | null
          nom_societe: string
          responsable_flowise_id: string | null
          secteur: Database["public"]["Enums"]["secteur_activite"] | null
          siret: string | null
          statut: Database["public"]["Enums"]["tenant_statut"]
          survey_token: string
          updated_at: string
          veille_mots_cles: string | null
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          boond_account_id?: string | null
          boond_oauth_token?: string | null
          bureau_etudes?: boolean
          code_postal?: string | null
          couleur_charte?: string | null
          created_at?: string
          date_souscription?: string | null
          deleted_at?: string | null
          effectif_tranche?:
            | Database["public"]["Enums"]["effectif_tranche"]
            | null
          forme_juridique?: string | null
          formule?: Database["public"]["Enums"]["tenant_formule"]
          id?: string
          ingest_token?: string
          liste_diffusion?: string | null
          logo_url?: string | null
          mentions_legales?: string | null
          nom_societe: string
          responsable_flowise_id?: string | null
          secteur?: Database["public"]["Enums"]["secteur_activite"] | null
          siret?: string | null
          statut?: Database["public"]["Enums"]["tenant_statut"]
          survey_token?: string
          updated_at?: string
          veille_mots_cles?: string | null
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          boond_account_id?: string | null
          boond_oauth_token?: string | null
          bureau_etudes?: boolean
          code_postal?: string | null
          couleur_charte?: string | null
          created_at?: string
          date_souscription?: string | null
          deleted_at?: string | null
          effectif_tranche?:
            | Database["public"]["Enums"]["effectif_tranche"]
            | null
          forme_juridique?: string | null
          formule?: Database["public"]["Enums"]["tenant_formule"]
          id?: string
          ingest_token?: string
          liste_diffusion?: string | null
          logo_url?: string | null
          mentions_legales?: string | null
          nom_societe?: string
          responsable_flowise_id?: string | null
          secteur?: Database["public"]["Enums"]["secteur_activite"] | null
          siret?: string | null
          statut?: Database["public"]["Enums"]["tenant_statut"]
          survey_token?: string
          updated_at?: string
          veille_mots_cles?: string | null
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_responsable_flowise_id_fkey"
            columns: ["responsable_flowise_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      veille_reglementaire: {
        Row: {
          actions_a_prevoir: string | null
          created_at: string
          created_by: string | null
          date_application: string | null
          date_publication: string | null
          deleted_at: string | null
          domaine: Database["public"]["Enums"]["veille_domaine"]
          id: string
          impact_smq: string | null
          intitule: string
          lien: string | null
          reference: string | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["veille_statut"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actions_a_prevoir?: string | null
          created_at?: string
          created_by?: string | null
          date_application?: string | null
          date_publication?: string | null
          deleted_at?: string | null
          domaine?: Database["public"]["Enums"]["veille_domaine"]
          id?: string
          impact_smq?: string | null
          intitule: string
          lien?: string | null
          reference?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["veille_statut"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actions_a_prevoir?: string | null
          created_at?: string
          created_by?: string | null
          date_application?: string | null
          date_publication?: string | null
          deleted_at?: string | null
          domaine?: Database["public"]["Enums"]["veille_domaine"]
          id?: string
          impact_smq?: string | null
          intitule?: string
          lien?: string | null
          reference?: string | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["veille_statut"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veille_reglementaire_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_reglementaire_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_reglementaire_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_reglementaire_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      veille_suggestions: {
        Row: {
          created_at: string
          date_texte: string | null
          deleted_at: string | null
          domaine: string | null
          id: string
          ref: string
          resume: string | null
          source: string
          statut: string
          tenant_id: string
          titre: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          date_texte?: string | null
          deleted_at?: string | null
          domaine?: string | null
          id?: string
          ref: string
          resume?: string | null
          source?: string
          statut?: string
          tenant_id: string
          titre: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          date_texte?: string | null
          deleted_at?: string | null
          domaine?: string | null
          id?: string
          ref?: string
          resume?: string | null
          source?: string
          statut?: string
          tenant_id?: string
          titre?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veille_suggestions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_entity_label: { Args: { r: Json }; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin_flowise: { Args: never; Returns: boolean }
      jwt_tenant_id: { Args: never; Returns: string }
      jwt_user_role: { Args: never; Returns: string }
    }
    Enums: {
      action_origine:
        | "manuelle"
        | "demarrage_smq"
        | "audit_interne"
        | "audit_externe"
        | "nc"
        | "rdd"
        | "r_o"
        | "reclamation"
        | "amelioration_continue"
        | "reunion"
        | "dysfonctionnement"
        | "incident"
        | "accident"
      action_priorite: "p1" | "p2" | "p3"
      action_statut:
        | "a_faire"
        | "en_cours"
        | "termine"
        | "bloquee"
        | "abandonnee"
      action_type: "preventive" | "corrective"
      audit_statut:
        | "planifie"
        | "en_cours"
        | "realise"
        | "rapport_redige"
        | "cloture"
      audit_type: "interne" | "externe" | "fournisseur"
      communication_canal:
        | "email"
        | "intranet"
        | "affichage"
        | "reunion"
        | "courrier"
        | "autre"
      communication_statut: "planifiee" | "realisee"
      communication_type:
        | "note_interne"
        | "communique"
        | "affichage"
        | "reunion"
        | "newsletter"
        | "autre"
      cotation_conformite:
        | "non_evalue"
        | "conforme"
        | "point_fort"
        | "point_attention"
        | "nc_mineure"
        | "nc_majeure"
        | "non_applicable"
      doc_maitrise_statut: "brouillon" | "en_vigueur" | "archive"
      doc_maitrise_type:
        | "manuel"
        | "procedure"
        | "instruction"
        | "enregistrement"
        | "formulaire"
        | "document_externe"
        | "autre"
      document_statut:
        | "brouillon"
        | "en_revue"
        | "approuvee"
        | "publiee"
        | "archivee"
      domaine_iso:
        | "contexte"
        | "leadership"
        | "planification"
        | "support"
        | "realisation"
        | "evaluation"
        | "amelioration"
      effectif_tranche: "1-9" | "10-49" | "50-99" | "100-299" | "300+"
      fournisseur_criticite: "faible" | "moyenne" | "critique"
      fournisseur_statut: "actif" | "inactif"
      indicateur_frequence:
        | "quotidien"
        | "hebdo"
        | "mensuel"
        | "trimestriel"
        | "annuel"
      indicateur_source: "manuel" | "boondmanager" | "calcul"
      indicateur_type: "numeric" | "percentage" | "count" | "duration"
      interaction_sens: "entrant" | "sortant"
      jalon_statut: "planifie" | "realise"
      jalon_type:
        | "audit_blanc"
        | "audit_certification"
        | "audit_surveillance"
        | "revue"
        | "autre"
      nc_gravite: "mineure" | "majeure" | "critique"
      nc_origine:
        | "audit_interne"
        | "audit_externe"
        | "client"
        | "collaborateur"
        | "rdd"
        | "autre"
      nc_statut:
        | "ouverte"
        | "analysee"
        | "action_definie"
        | "cloturee"
        | "efficace"
        | "inefficace"
      nc_type: "nc_produit" | "nc_processus" | "reclamation_client"
      notification_type:
        | "approval_request"
        | "approval_granted"
        | "deadline_action"
        | "audit_upcoming"
        | "kpi_alert"
        | "nc_assigned"
        | "nc_overdue"
        | "rdd_due"
        | "boond_sync_error"
        | "policy_review_due"
        | "mention"
        | "retour_update"
      objectif_sens: "hausse" | "baisse"
      objectif_statut: "actif" | "atteint" | "abandonne"
      pi_influence: "faible" | "moyen" | "fort"
      pi_interaction: "faible" | "moyenne" | "forte" | "elevee"
      pi_maitrise: "maitrise" | "partiel" | "non_maitrise"
      pi_sphere: "interne" | "externe"
      pi_type:
        | "client"
        | "fournisseur"
        | "collaborateur"
        | "autorite"
        | "actionnaire"
        | "autre"
      processus_type: "pilotage" | "realisation" | "support"
      reclamation_canal:
        | "mail"
        | "tel"
        | "visio"
        | "audit"
        | "enquete"
        | "autre"
      reclamation_statut: "recue" | "analysee" | "traitee" | "cloturee"
      remontee_type: "reclamation" | "dysfonctionnement" | "incident" | "accident"
      reunion_statut: "planifiee" | "terminee"
      reunion_type: "comite_qhse" | "reunion_echange" | "revue" | "autre"
      retour_statut: "nouveau" | "en_cours" | "traite" | "rejete"
      retour_type: "bug" | "amelioration" | "remarque"
      revue_statut: "planifiee" | "realisee" | "cloturee"
      ro_statut: "identifie" | "en_traitement" | "maitrise" | "cloture"
      ro_type: "risque" | "opportunite"
      secteur_activite: "SI" | "ESN" | "AT" | "autre"
      tenant_formule: "Essentiel" | "Tandem" | "Premium"
      tenant_statut: "Actif" | "Suspendu" | "Résilié"
      user_role: "admin_flowise" | "dirigeant" | "manager" | "auditeur"
      veille_domaine:
        | "travail"
        | "qualite"
        | "environnement"
        | "securite"
        | "rgpd"
        | "autre"
      veille_statut: "a_analyser" | "analysee" | "integree" | "sans_objet"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_origine: [
        "manuelle",
        "demarrage_smq",
        "audit_interne",
        "audit_externe",
        "nc",
        "rdd",
        "r_o",
        "reclamation",
        "amelioration_continue",
        "reunion",
        "dysfonctionnement",
        "incident",
        "accident",
      ],
      action_priorite: ["p1", "p2", "p3"],
      action_statut: [
        "a_faire",
        "en_cours",
        "termine",
        "bloquee",
        "abandonnee",
      ],
      action_type: ["preventive", "corrective"],
      audit_statut: [
        "planifie",
        "en_cours",
        "realise",
        "rapport_redige",
        "cloture",
      ],
      audit_type: ["interne", "externe", "fournisseur"],
      communication_canal: [
        "email",
        "intranet",
        "affichage",
        "reunion",
        "courrier",
        "autre",
      ],
      communication_statut: ["planifiee", "realisee"],
      communication_type: [
        "note_interne",
        "communique",
        "affichage",
        "reunion",
        "newsletter",
        "autre",
      ],
      cotation_conformite: [
        "non_evalue",
        "conforme",
        "point_fort",
        "point_attention",
        "nc_mineure",
        "nc_majeure",
        "non_applicable",
      ],
      doc_maitrise_statut: ["brouillon", "en_vigueur", "archive"],
      doc_maitrise_type: [
        "manuel",
        "procedure",
        "instruction",
        "enregistrement",
        "formulaire",
        "document_externe",
        "autre",
      ],
      document_statut: [
        "brouillon",
        "en_revue",
        "approuvee",
        "publiee",
        "archivee",
      ],
      domaine_iso: [
        "contexte",
        "leadership",
        "planification",
        "support",
        "realisation",
        "evaluation",
        "amelioration",
      ],
      effectif_tranche: ["1-9", "10-49", "50-99", "100-299", "300+"],
      fournisseur_criticite: ["faible", "moyenne", "critique"],
      fournisseur_statut: ["actif", "inactif"],
      indicateur_frequence: [
        "quotidien",
        "hebdo",
        "mensuel",
        "trimestriel",
        "annuel",
      ],
      indicateur_source: ["manuel", "boondmanager", "calcul"],
      indicateur_type: ["numeric", "percentage", "count", "duration"],
      interaction_sens: ["entrant", "sortant"],
      jalon_statut: ["planifie", "realise"],
      jalon_type: [
        "audit_blanc",
        "audit_certification",
        "audit_surveillance",
        "revue",
        "autre",
      ],
      nc_gravite: ["mineure", "majeure", "critique"],
      nc_origine: [
        "audit_interne",
        "audit_externe",
        "client",
        "collaborateur",
        "rdd",
        "autre",
      ],
      nc_statut: [
        "ouverte",
        "analysee",
        "action_definie",
        "cloturee",
        "efficace",
        "inefficace",
      ],
      nc_type: ["nc_produit", "nc_processus", "reclamation_client"],
      notification_type: [
        "approval_request",
        "approval_granted",
        "deadline_action",
        "audit_upcoming",
        "kpi_alert",
        "nc_assigned",
        "nc_overdue",
        "rdd_due",
        "boond_sync_error",
        "policy_review_due",
        "mention",
        "retour_update",
      ],
      objectif_sens: ["hausse", "baisse"],
      objectif_statut: ["actif", "atteint", "abandonne"],
      pi_influence: ["faible", "moyen", "fort"],
      pi_interaction: ["faible", "moyenne", "forte", "elevee"],
      pi_maitrise: ["maitrise", "partiel", "non_maitrise"],
      pi_sphere: ["interne", "externe"],
      pi_type: [
        "client",
        "fournisseur",
        "collaborateur",
        "autorite",
        "actionnaire",
        "autre",
      ],
      processus_type: ["pilotage", "realisation", "support"],
      reclamation_canal: ["mail", "tel", "visio", "audit", "enquete", "autre"],
      reclamation_statut: ["recue", "analysee", "traitee", "cloturee"],
      remontee_type: ["reclamation", "dysfonctionnement", "incident", "accident"],
      reunion_statut: ["planifiee", "terminee"],
      reunion_type: ["comite_qhse", "reunion_echange", "revue", "autre"],
      retour_statut: ["nouveau", "en_cours", "traite", "rejete"],
      retour_type: ["bug", "amelioration", "remarque"],
      revue_statut: ["planifiee", "realisee", "cloturee"],
      ro_statut: ["identifie", "en_traitement", "maitrise", "cloture"],
      ro_type: ["risque", "opportunite"],
      secteur_activite: ["SI", "ESN", "AT", "autre"],
      tenant_formule: ["Essentiel", "Tandem", "Premium"],
      tenant_statut: ["Actif", "Suspendu", "Résilié"],
      user_role: ["admin_flowise", "dirigeant", "manager", "auditeur"],
      veille_domaine: [
        "travail",
        "qualite",
        "environnement",
        "securite",
        "rgpd",
        "autre",
      ],
      veille_statut: ["a_analyser", "analysee", "integree", "sans_objet"],
    },
  },
} as const
