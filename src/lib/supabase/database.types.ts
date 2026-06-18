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
          commentaires: string | null
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
          reference: string
          reference_iso: string[] | null
          responsable_id: string | null
          statut: Database["public"]["Enums"]["action_statut"]
          tenant_id: string
          type: Database["public"]["Enums"]["action_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commentaires?: string | null
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
          reference: string
          reference_iso?: string[] | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["action_statut"]
          tenant_id: string
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commentaires?: string | null
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
          reference?: string
          reference_iso?: string[] | null
          responsable_id?: string | null
          statut?: Database["public"]["Enums"]["action_statut"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["action_type"]
          updated_at?: string
          updated_by?: string | null
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
      audit_log: {
        Row: {
          action: string
          created_at: string
          diff: Json | null
          entity_id: string | null
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
      politique_qualite: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contenu: Json | null
          created_at: string
          created_by: string | null
          id: string
          signature_data: Json | null
          statut: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
          version_actuelle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          signature_data?: Json | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          version_actuelle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          signature_data?: Json | null
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
          contenu: Json | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description_courte: string | null
          id: string
          pilote_id: string | null
          processus_id: string | null
          reference_iso: string[] | null
          signature_data: Json | null
          statut: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          titre: string
          updated_at: string
          updated_by: string | null
          version_actuelle_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description_courte?: string | null
          id?: string
          pilote_id?: string | null
          processus_id?: string | null
          reference_iso?: string[] | null
          signature_data?: Json | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id: string
          titre: string
          updated_at?: string
          updated_by?: string | null
          version_actuelle_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contenu?: Json | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description_courte?: string | null
          id?: string
          pilote_id?: string | null
          processus_id?: string | null
          reference_iso?: string[] | null
          signature_data?: Json | null
          statut?: Database["public"]["Enums"]["document_statut"]
          tenant_id?: string
          titre?: string
          updated_at?: string
          updated_by?: string | null
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
          pdf_url: string | null
          procedure_id: string
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
          procedure_id: string
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
          procedure_id?: string
          signature_data?: Json | null
          tenant_id?: string
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
          deleted_at: string | null
          description: string | null
          entrees: string | null
          id: string
          nom: string
          ordre_affichage: number
          pilote_id: string | null
          ressources_associees: string | null
          sorties: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["processus_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          entrees?: string | null
          id?: string
          nom: string
          ordre_affichage?: number
          pilote_id?: string | null
          ressources_associees?: string | null
          sorties?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["processus_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          entrees?: string | null
          id?: string
          nom?: string
          ordre_affichage?: number
          pilote_id?: string | null
          ressources_associees?: string | null
          sorties?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["processus_type"]
          updated_at?: string
          updated_by?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen: string | null
          notification_preferences: Json
          role: Database["public"]["Enums"]["user_role"]
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
          notification_preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
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
          notification_preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
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
      risques_opportunites: {
        Row: {
          cause: string | null
          consequence: string | null
          created_at: string
          created_by: string | null
          criticite: number | null
          date_revue: string | null
          deleted_at: string | null
          gravite: number
          id: string
          intitule: string
          probabilite: number
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
          date_revue?: string | null
          deleted_at?: string | null
          gravite?: number
          id?: string
          intitule: string
          probabilite?: number
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
          date_revue?: string | null
          deleted_at?: string | null
          gravite?: number
          id?: string
          intitule?: string
          probabilite?: number
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
      tenants: {
        Row: {
          boond_account_id: string | null
          boond_oauth_token: string | null
          created_at: string
          date_souscription: string | null
          effectif_tranche:
            | Database["public"]["Enums"]["effectif_tranche"]
            | null
          formule: Database["public"]["Enums"]["tenant_formule"]
          id: string
          logo_url: string | null
          nom_societe: string
          secteur: Database["public"]["Enums"]["secteur_activite"] | null
          statut: Database["public"]["Enums"]["tenant_statut"]
          updated_at: string
        }
        Insert: {
          boond_account_id?: string | null
          boond_oauth_token?: string | null
          created_at?: string
          date_souscription?: string | null
          effectif_tranche?:
            | Database["public"]["Enums"]["effectif_tranche"]
            | null
          formule?: Database["public"]["Enums"]["tenant_formule"]
          id?: string
          logo_url?: string | null
          nom_societe: string
          secteur?: Database["public"]["Enums"]["secteur_activite"] | null
          statut?: Database["public"]["Enums"]["tenant_statut"]
          updated_at?: string
        }
        Update: {
          boond_account_id?: string | null
          boond_oauth_token?: string | null
          created_at?: string
          date_souscription?: string | null
          effectif_tranche?:
            | Database["public"]["Enums"]["effectif_tranche"]
            | null
          formule?: Database["public"]["Enums"]["tenant_formule"]
          id?: string
          logo_url?: string | null
          nom_societe?: string
          secteur?: Database["public"]["Enums"]["secteur_activite"] | null
          statut?: Database["public"]["Enums"]["tenant_statut"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin_flowise: { Args: never; Returns: boolean }
      jwt_tenant_id: { Args: never; Returns: string }
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
      action_priorite: "p1" | "p2" | "p3"
      action_statut:
        | "a_faire"
        | "en_cours"
        | "termine"
        | "bloquee"
        | "abandonnee"
      action_type: "preventive" | "corrective"
      document_statut:
        | "brouillon"
        | "en_revue"
        | "approuvee"
        | "publiee"
        | "archivee"
      effectif_tranche: "1-9" | "10-49" | "50-99" | "100-299" | "300+"
      indicateur_frequence:
        | "quotidien"
        | "hebdo"
        | "mensuel"
        | "trimestriel"
        | "annuel"
      indicateur_source: "manuel" | "boondmanager" | "calcul"
      indicateur_type: "numeric" | "percentage" | "count" | "duration"
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
      processus_type: "pilotage" | "realisation" | "support"
      ro_statut: "identifie" | "en_traitement" | "maitrise" | "cloture"
      ro_type: "risque" | "opportunite"
      secteur_activite: "SI" | "ESN" | "AT" | "autre"
      tenant_formule: "Essentiel" | "Tandem" | "Premium"
      tenant_statut: "Actif" | "Suspendu" | "Résilié"
      user_role: "admin_flowise" | "dirigeant" | "manager" | "auditeur"
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
      document_statut: [
        "brouillon",
        "en_revue",
        "approuvee",
        "publiee",
        "archivee",
      ],
      effectif_tranche: ["1-9", "10-49", "50-99", "100-299", "300+"],
      indicateur_frequence: [
        "quotidien",
        "hebdo",
        "mensuel",
        "trimestriel",
        "annuel",
      ],
      indicateur_source: ["manuel", "boondmanager", "calcul"],
      indicateur_type: ["numeric", "percentage", "count", "duration"],
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
      ],
      processus_type: ["pilotage", "realisation", "support"],
      ro_statut: ["identifie", "en_traitement", "maitrise", "cloture"],
      ro_type: ["risque", "opportunite"],
      secteur_activite: ["SI", "ESN", "AT", "autre"],
      tenant_formule: ["Essentiel", "Tandem", "Premium"],
      tenant_statut: ["Actif", "Suspendu", "Résilié"],
      user_role: ["admin_flowise", "dirigeant", "manager", "auditeur"],
    },
  },
} as const
