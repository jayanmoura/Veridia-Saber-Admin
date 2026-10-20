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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          app_version: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          platform: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          action_type: string
          created_at: string
          details: string | null
          id: number
          local_id: number | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          action_type: string
          created_at?: string
          details?: string | null
          id?: number
          local_id?: number | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          action_type?: string
          created_at?: string
          details?: string | null
          id?: number
          local_id?: number | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_display"
            referencedColumns: ["id"]
          },
        ]
      }
      colecao_imagens: {
        Row: {
          created_at: string
          id: number
          planta_colecao_id: string
          url_imagem: string
        }
        Insert: {
          created_at?: string
          id?: number
          planta_colecao_id: string
          url_imagem: string
        }
        Update: {
          created_at?: string
          id?: number
          planta_colecao_id?: string
          url_imagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "colecao_imagens_planta_colecao_id_fkey"
            columns: ["planta_colecao_id"]
            isOneToOne: false
            referencedRelation: "plantas_da_colecao"
            referencedColumns: ["id"]
          },
        ]
      }
      colecoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          imagem_capa: string | null
          institution_id: string | null
          nome_colecao: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_capa?: string | null
          institution_id?: string | null
          nome_colecao?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_capa?: string | null
          institution_id?: string | null
          nome_colecao?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colecoes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_orgaos: {
        Row: {
          conteudo: string | null
          id: number
          ordem: number
          orgao: string
          titulo: string
        }
        Insert: {
          conteudo?: string | null
          id?: number
          ordem?: number
          orgao: string
          titulo: string
        }
        Update: {
          conteudo?: string | null
          id?: number
          ordem?: number
          orgao?: string
          titulo?: string
        }
        Relationships: []
      }
      especie: {
        Row: {
          autor: string | null
          codigo_vs: string
          created_at: string
          created_by: string | null
          created_by_institution_id: string | null
          created_by_name: string | null
          cuidados_agua: string | null
          cuidados_luz: string | null
          cuidados_nutrientes: string | null
          cuidados_substrato: string | null
          cuidados_temperatura: string | null
          descricao_especie: string | null
          familia_custom: string | null
          familia_id: string | null
          id: string
          local_id: number | null
          nome_cientifico: string
          nome_popular: string | null
        }
        Insert: {
          autor?: string | null
          codigo_vs: string
          created_at?: string
          created_by?: string | null
          created_by_institution_id?: string | null
          created_by_name?: string | null
          cuidados_agua?: string | null
          cuidados_luz?: string | null
          cuidados_nutrientes?: string | null
          cuidados_substrato?: string | null
          cuidados_temperatura?: string | null
          descricao_especie?: string | null
          familia_custom?: string | null
          familia_id?: string | null
          id?: string
          local_id?: number | null
          nome_cientifico: string
          nome_popular?: string | null
        }
        Update: {
          autor?: string | null
          codigo_vs?: string
          created_at?: string
          created_by?: string | null
          created_by_institution_id?: string | null
          created_by_name?: string | null
          cuidados_agua?: string | null
          cuidados_luz?: string | null
          cuidados_nutrientes?: string | null
          cuidados_substrato?: string | null
          cuidados_temperatura?: string | null
          descricao_especie?: string | null
          familia_custom?: string | null
          familia_id?: string | null
          id?: string
          local_id?: number | null
          nome_cientifico?: string
          nome_popular?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especie_created_by_institution_id_fkey"
            columns: ["created_by_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
        ]
      }
      especie_local: {
        Row: {
          coletor: string | null
          created_at: string
          created_by: string | null
          data_determinacao: string | null
          descricao_ocorrencia: string | null
          detalhes_localizacao: string | null
          determinador: string | null
          especie_id: string
          habitat_ecologia: string | null
          id: number
          institution_id: string
          latitude: number | null
          local_id: number
          longitude: number | null
          morfologia: string | null
          nome_popular_local: string | null
          numero_coletor: string | null
          tombo_codigo: string
          tombo_num: number
        }
        Insert: {
          coletor?: string | null
          created_at?: string
          created_by?: string | null
          data_determinacao?: string | null
          descricao_ocorrencia?: string | null
          detalhes_localizacao?: string | null
          determinador?: string | null
          especie_id: string
          habitat_ecologia?: string | null
          id?: number
          institution_id: string
          latitude?: number | null
          local_id: number
          longitude?: number | null
          morfologia?: string | null
          nome_popular_local?: string | null
          numero_coletor?: string | null
          tombo_codigo: string
          tombo_num: number
        }
        Update: {
          coletor?: string | null
          created_at?: string
          created_by?: string | null
          data_determinacao?: string | null
          descricao_ocorrencia?: string | null
          detalhes_localizacao?: string | null
          determinador?: string | null
          especie_id?: string
          habitat_ecologia?: string | null
          id?: number
          institution_id?: string
          latitude?: number | null
          local_id?: number
          longitude?: number | null
          morfologia?: string | null
          nome_popular_local?: string | null
          numero_coletor?: string | null
          tombo_codigo?: string
          tombo_num?: number
        }
        Relationships: [
          {
            foreignKeyName: "especie_local_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
          {
            foreignKeyName: "fk_especie_local_cascade"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_especie_local_cascade"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "view_pendentes_oficial"
            referencedColumns: ["id"]
          },
        ]
      }
      especie_local_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          descricao_especie: string | null
          especie_id: string
          id: number
          local_id: number
          notas_projeto: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao_especie?: string | null
          especie_id: string
          id?: never
          local_id: number
          notas_projeto?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao_especie?: string | null
          especie_id?: string
          id?: never
          local_id?: number
          notas_projeto?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "especie_local_overrides_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_overrides_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "view_pendentes_oficial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_overrides_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_overrides_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
        ]
      }
      estados: {
        Row: {
          id: number
          nome: string
          uf: string
        }
        Insert: {
          id: number
          nome: string
          uf: string
        }
        Update: {
          id?: number
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      familia: {
        Row: {
          autoria_taxonomica: string | null
          caracteristicas: string | null
          created_at: string
          created_by: string | null
          created_by_institution_id: string | null
          created_by_name: string | null
          descricao_familia: string | null
          distribuicao_geografica: string | null
          familia_nome: string
          fonte_referencia: string | null
          id: string
          imagem_micro: string | null
          imagem_referencia: string | null
          imagem_thumbnail: string | null
          link_referencia: string | null
        }
        Insert: {
          autoria_taxonomica?: string | null
          caracteristicas?: string | null
          created_at?: string
          created_by?: string | null
          created_by_institution_id?: string | null
          created_by_name?: string | null
          descricao_familia?: string | null
          distribuicao_geografica?: string | null
          familia_nome: string
          fonte_referencia?: string | null
          id?: string
          imagem_micro?: string | null
          imagem_referencia?: string | null
          imagem_thumbnail?: string | null
          link_referencia?: string | null
        }
        Update: {
          autoria_taxonomica?: string | null
          caracteristicas?: string | null
          created_at?: string
          created_by?: string | null
          created_by_institution_id?: string | null
          created_by_name?: string | null
          descricao_familia?: string | null
          distribuicao_geografica?: string | null
          familia_nome?: string
          fonte_referencia?: string | null
          id?: string
          imagem_micro?: string | null
          imagem_referencia?: string | null
          imagem_thumbnail?: string | null
          link_referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "familia_created_by_institution_id_fkey"
            columns: ["created_by_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      familia_nomenclatura_legado: {
        Row: {
          created_at: string
          familia_id: string
          fonte: string | null
          id: string
          nome_legado: string
          observacao: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string
          familia_id: string
          fonte?: string | null
          id?: string
          nome_legado: string
          observacao?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string
          familia_id?: string
          fonte?: string | null
          id?: string
          nome_legado?: string
          observacao?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_familia"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
        ]
      }
      imagens: {
        Row: {
          created_at: string | null
          creditos: string | null
          criado_por: string | null
          especie_id: string | null
          especime_id: number | null
          id: string
          institution_id: string | null
          local_id: number | null
          tamanho_estimado: boolean | null
          tamanho_micro: number | null
          tamanho_original: number | null
          tamanho_thumbnail: number | null
          url_imagem: string
          url_micro: string | null
          url_thumbnail: string | null
        }
        Insert: {
          created_at?: string | null
          creditos?: string | null
          criado_por?: string | null
          especie_id?: string | null
          especime_id?: number | null
          id?: string
          institution_id?: string | null
          local_id?: number | null
          tamanho_estimado?: boolean | null
          tamanho_micro?: number | null
          tamanho_original?: number | null
          tamanho_thumbnail?: number | null
          url_imagem: string
          url_micro?: string | null
          url_thumbnail?: string | null
        }
        Update: {
          created_at?: string | null
          creditos?: string | null
          criado_por?: string | null
          especie_id?: string | null
          especime_id?: number | null
          id?: string
          institution_id?: string | null
          local_id?: number | null
          tamanho_estimado?: boolean | null
          tamanho_micro?: number | null
          tamanho_original?: number | null
          tamanho_thumbnail?: number | null
          url_imagem?: string
          url_micro?: string | null
          url_thumbnail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_especie_cascade"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_especie_cascade"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "view_pendentes_oficial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagens_especime_id_fkey"
            columns: ["especime_id"]
            isOneToOne: false
            referencedRelation: "especie_local"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagens_especime_id_fkey"
            columns: ["especime_id"]
            isOneToOne: false
            referencedRelation: "especime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagens_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagens_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagens_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      locais: {
        Row: {
          cidade: string | null
          contato: string | null
          created_at: string
          descricao: string | null
          endereco: string | null
          estado: string | null
          gestor_id: string | null
          historia: string | null
          id: number
          imagem_capa: string | null
          institution_id: string
          latitude: number | null
          longitude: number | null
          nome: string
          sigla: string | null
          tipo: string | null
        }
        Insert: {
          cidade?: string | null
          contato?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          gestor_id?: string | null
          historia?: string | null
          id?: number
          imagem_capa?: string | null
          institution_id: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          sigla?: string | null
          tipo?: string | null
        }
        Update: {
          cidade?: string | null
          contato?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          gestor_id?: string | null
          historia?: string | null
          id?: number
          imagem_capa?: string | null
          institution_id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          sigla?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locais_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          estado_id: number
          id: number
          nome: string
        }
        Insert: {
          estado_id: number
          id: number
          nome: string
        }
        Update: {
          estado_id?: number
          id?: number
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipios_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      plantas_da_colecao: {
        Row: {
          anotacoes: string | null
          colecao_id: string
          created_at: string
          data_registro: string
          especie: string | null
          estado_id: number | null
          familia_custom: string | null
          familia_id: string | null
          fotos: Json
          id: string
          institution_id: string | null
          latitude: number | null
          longitude: number | null
          municipio_id: number | null
          nome_popular: string | null
          user_id: string | null
        }
        Insert: {
          anotacoes?: string | null
          colecao_id: string
          created_at?: string
          data_registro: string
          especie?: string | null
          estado_id?: number | null
          familia_custom?: string | null
          familia_id?: string | null
          fotos?: Json
          id?: string
          institution_id?: string | null
          latitude?: number | null
          longitude?: number | null
          municipio_id?: number | null
          nome_popular?: string | null
          user_id?: string | null
        }
        Update: {
          anotacoes?: string | null
          colecao_id?: string
          created_at?: string
          data_registro?: string
          especie?: string | null
          estado_id?: number | null
          familia_custom?: string | null
          familia_id?: string | null
          fotos?: Json
          id?: string
          institution_id?: string | null
          latitude?: number | null
          longitude?: number | null
          municipio_id?: number | null
          nome_popular?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantas_da_colecao_colecao_id_fkey"
            columns: ["colecao_id"]
            isOneToOne: false
            referencedRelation: "colecoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantas_da_colecao_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantas_da_colecao_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantas_da_colecao_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantas_da_colecao_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          institution_id: string | null
          local_id: number | null
          role: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          institution_id?: string | null
          local_id?: number | null
          role?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          institution_id?: string | null
          local_id?: number | null
          role?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
        ]
      }
      relatorios_periodicos: {
        Row: {
          ano: number
          dados: Json
          gerado_em: string
          id: number
          periodo_fim: string
          periodo_inicio: string
          periodo_label: string
          tipo: string
        }
        Insert: {
          ano: number
          dados: Json
          gerado_em?: string
          id?: never
          periodo_fim: string
          periodo_inicio: string
          periodo_label: string
          tipo: string
        }
        Update: {
          ano?: number
          dados?: Json
          gerado_em?: string
          id?: never
          periodo_fim?: string
          periodo_inicio?: string
          periodo_label?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      analytics_daily_active_users: {
        Row: {
          active_users: number | null
          date: string | null
        }
        Relationships: []
      }
      analytics_events_summary: {
        Row: {
          count: number | null
          event_type: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      especime: {
        Row: {
          coletor: string | null
          created_at: string | null
          created_by: string | null
          data_determinacao: string | null
          descricao_ocorrencia: string | null
          detalhes_localizacao: string | null
          determinador: string | null
          especie_id: string | null
          habitat_ecologia: string | null
          id: number | null
          institution_id: string | null
          latitude: number | null
          local_id: number | null
          longitude: number | null
          morfologia: string | null
          nome_popular_local: string | null
          numero_coletor: string | null
        }
        Insert: {
          coletor?: string | null
          created_at?: string | null
          created_by?: string | null
          data_determinacao?: string | null
          descricao_ocorrencia?: string | null
          detalhes_localizacao?: string | null
          determinador?: string | null
          especie_id?: string | null
          habitat_ecologia?: string | null
          id?: number | null
          institution_id?: string | null
          latitude?: number | null
          local_id?: number | null
          longitude?: number | null
          morfologia?: string | null
          nome_popular_local?: string | null
          numero_coletor?: string | null
        }
        Update: {
          coletor?: string | null
          created_at?: string | null
          created_by?: string | null
          data_determinacao?: string | null
          descricao_ocorrencia?: string | null
          detalhes_localizacao?: string | null
          determinador?: string | null
          especie_id?: string | null
          habitat_ecologia?: string | null
          id?: number | null
          institution_id?: string | null
          latitude?: number | null
          local_id?: number | null
          longitude?: number | null
          morfologia?: string | null
          nome_popular_local?: string | null
          numero_coletor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especie_local_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_local_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
          {
            foreignKeyName: "fk_especie_local_cascade"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_especie_local_cascade"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "view_pendentes_oficial"
            referencedColumns: ["id"]
          },
        ]
      }
      locais_estatisticas: {
        Row: {
          local_id: number | null
          total_especies: number | null
          total_familias: number | null
        }
        Relationships: []
      }
      user_roles_display: {
        Row: {
          cargo_display: string | null
          email: string | null
          full_name: string | null
          id: string | null
          local_id: number | null
          role: string | null
        }
        Insert: {
          cargo_display?: never
          email?: string | null
          full_name?: string | null
          id?: string | null
          local_id?: number | null
          role?: string | null
        }
        Update: {
          cargo_display?: never
          email?: string | null
          full_name?: string | null
          id?: string | null
          local_id?: number | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais_estatisticas"
            referencedColumns: ["local_id"]
          },
        ]
      }
      view_pendentes_oficial: {
        Row: {
          created_at: string | null
          created_by_institution_id: string | null
          cuidados_agua: string | null
          cuidados_luz: string | null
          cuidados_nutrientes: string | null
          cuidados_substrato: string | null
          cuidados_temperatura: string | null
          descricao_especie: string | null
          familia_custom: string | null
          familia_id: string | null
          foto_provisoria: string | null
          id: string | null
          nome_cientifico: string | null
          nome_popular: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_institution_id?: string | null
          cuidados_agua?: string | null
          cuidados_luz?: string | null
          cuidados_nutrientes?: string | null
          cuidados_substrato?: string | null
          cuidados_temperatura?: string | null
          descricao_especie?: string | null
          familia_custom?: string | null
          familia_id?: string | null
          foto_provisoria?: never
          id?: string | null
          nome_cientifico?: string | null
          nome_popular?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_institution_id?: string | null
          cuidados_agua?: string | null
          cuidados_luz?: string | null
          cuidados_nutrientes?: string | null
          cuidados_substrato?: string | null
          cuidados_temperatura?: string | null
          descricao_especie?: string | null
          familia_custom?: string | null
          familia_id?: string | null
          foto_provisoria?: never
          id?: string | null
          nome_cientifico?: string | null
          nome_popular?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especie_created_by_institution_id_fkey"
            columns: ["created_by_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "especie_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      buscar_botanica: {
        Args: { termo_busca: string; tipo_filtro: string }
        Returns: {
          descricao: string
          id: string
          nome: string
          tipo: string
        }[]
      }
      buscar_especie_autocomplete: {
        Args: { termo: string }
        Returns: {
          autor: string
          familia_id: string
          id: string
          nome_cientifico: string
          nome_popular: string
        }[]
      }
      fn_agregar_audit_logs: {
        Args: { p_fim: string; p_inicio: string }
        Returns: Json
      }
      fn_gerar_relatorios_periodicos: { Args: never; Returns: undefined }
      fn_limpar_audit_logs_antigos: { Args: never; Returns: undefined }
      fn_somar_dados_relatorios: { Args: { p_ids: number[] }; Returns: Json }
      get_my_institution_id: { Args: never; Returns: string }
      get_profile_names: {
        Args: { p_ids: string[] }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      get_role_level: { Args: { role_name: string }; Returns: number }
      get_user_local_id: { Args: never; Returns: number }
      get_user_role: { Args: never; Returns: string }
      is_global_admin: { Args: never; Returns: boolean }
      is_global_taxonomist: { Args: never; Returns: boolean }
      is_local_manager_of: {
        Args: { target_local_id: number }
        Returns: boolean
      }
      is_local_staff_for: {
        Args: { target_local_id: number }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      rebaixar_membro_projeto: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
