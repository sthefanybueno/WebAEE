/**
 * Sistema AEE — Entidade de Domínio: Usuário
 *
 * PapelUsuario alinhado com o backend (app/domain/entities/user.py).
 */

export enum PapelUsuario {
  ADMIN = 'admin',
  COORDENACAO = 'coordenacao',
  PROF_AEE = 'prof_aee',
  PROF_APOIO = 'prof_apoio',
  PROF_REGENTE = 'prof_regente',
}

export interface Usuario {
  id: string
  tenantId: string
  nome: string
  email: string
  papel: PapelUsuario
  ativo: boolean
}
