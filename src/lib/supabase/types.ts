export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          objetivo: string | null
          streak: number
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          objetivo?: string | null
          streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          nome?: string
          objetivo?: string | null
          streak?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      fichas: {
        Row: {
          id: string
          user_id: string
          letra: string
          nome: string
          cor: string
          icone: string | null
          duracao_min: number
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          letra: string
          nome: string
          cor?: string
          icone?: string | null
          duracao_min?: number
          ordem?: number
          created_at?: string
        }
        Update: {
          letra?: string
          nome?: string
          cor?: string
          icone?: string | null
          duracao_min?: number
          ordem?: number
        }
        Relationships: []
      }
      exercicios: {
        Row: {
          id: string
          ficha_id: string
          nome: string
          grupo: string | null
          series: number
          reps: string
          carga: number
          descanso: number
          tipo: string
          duracao_seg: number | null
          duracao_min: number | null
          intensidade: string | null
          yt_id: string | null
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          ficha_id: string
          nome: string
          grupo?: string | null
          series?: number
          reps?: string
          carga?: number
          descanso?: number
          tipo?: string
          duracao_seg?: number | null
          duracao_min?: number | null
          intensidade?: string | null
          yt_id?: string | null
          ordem?: number
          created_at?: string
        }
        Update: {
          nome?: string
          grupo?: string | null
          series?: number
          reps?: string
          carga?: number
          descanso?: number
          tipo?: string
          duracao_seg?: number | null
          duracao_min?: number | null
          intensidade?: string | null
          yt_id?: string | null
          ordem?: number
        }
        Relationships: []
      }
      treinos: {
        Row: {
          id: string
          user_id: string
          ficha_id: string | null
          ficha_letra: string | null
          data: string
          duracao_min: number | null
          volume_total: number
          teve_pr: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ficha_id?: string | null
          ficha_letra?: string | null
          data?: string
          duracao_min?: number | null
          volume_total?: number
          teve_pr?: boolean
          created_at?: string
        }
        Update: {
          duracao_min?: number | null
          volume_total?: number
          teve_pr?: boolean
        }
        Relationships: []
      }
      sets_log: {
        Row: {
          id: string
          treino_id: string
          exercicio_id: string | null
          exercicio_nome: string | null
          serie_num: number
          carga: number | null
          reps: number | null
          duracao_seg: number | null
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          treino_id: string
          exercicio_id?: string | null
          exercicio_nome?: string | null
          serie_num: number
          carga?: number | null
          reps?: number | null
          duracao_seg?: number | null
          done?: boolean
          created_at?: string
        }
        Update: {
          carga?: number | null
          reps?: number | null
          duracao_seg?: number | null
          done?: boolean
        }
        Relationships: []
      }
      trainer_student_links: {
        Row: {
          id: string
          trainer_id: string
          student_id: string
          status: string
          requested_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          trainer_id: string
          student_id: string
          status?: string
          requested_at?: string
          approved_at?: string | null
        }
        Update: {
          status?: string
          approved_at?: string | null
        }
        Relationships: []
      }
      medidas: {
        Row: {
          id: string
          user_id: string
          data: string
          peso: number | null
          altura: number | null
          gordura: number | null
          braco_d: number | null
          braco_e: number | null
          peito: number | null
          cintura: number | null
          quadril: number | null
          coxa_d: number | null
          coxa_e: number | null
          panturrilha: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data?: string
          peso?: number | null
          altura?: number | null
          gordura?: number | null
          braco_d?: number | null
          braco_e?: number | null
          peito?: number | null
          cintura?: number | null
          quadril?: number | null
          coxa_d?: number | null
          coxa_e?: number | null
          panturrilha?: number | null
          created_at?: string
        }
        Update: {
          data?: string
          peso?: number | null
          altura?: number | null
          gordura?: number | null
          braco_d?: number | null
          braco_e?: number | null
          peito?: number | null
          cintura?: number | null
          quadril?: number | null
          coxa_d?: number | null
          coxa_e?: number | null
          panturrilha?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
