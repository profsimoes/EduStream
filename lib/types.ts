export type Perfil = 'aluno' | 'professor' | 'admin'

export interface Usuario {
  id_usuario: number
  nome: string
  email: string
  id_perfil: number
}

export interface Categoria {
  id_categoria: number
  nome: string
  descricao: string | null
}

export interface Conteudo {
  id_conteudo: number
  titulo: string
  descricao: string | null
  tipo: string
  link_conteudo: string | null
  data_publicacao: string | null
  duracao_segundos: number
  id_categoria: number
}

export interface HistoricoVisualizacao {
  id_historico: number
  id_usuario: number
  id_conteudo: number
  data_hora_acesso: string
  segundos_assistidos: number
  concluido: boolean
}

export interface Avaliacao {
  id_avaliacao: number
  id_usuario: number
  id_conteudo: number
  nota: number
  comentario: string | null
  data_avaliacao: string
}
