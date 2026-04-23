export type Role = 'customer' | 'admin' | 'developer'

export type ProjectStatus =
  | 'pending_payment'
  | 'paid'
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'delivered'
  | 'completed'

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface UserProfile {
  id: string       // Firestore doc ID = Firebase Auth UID
  email: string
  name: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  description: string
  images: string[]
}

export interface Order {
  id: string
  userId: string
  productId: string
  paymentStatus: PaymentStatus
  projectStatus: ProjectStatus
  assignedDevId?: string
  createdAt: Date
}

export interface OrderDetails {
  id: string
  orderId: string
  businessName: string
  content: string
  references: string[]
}

export interface ProjectUpdate {
  id: string
  orderId: string
  status: ProjectStatus
  note: string
  createdAt: Date
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  pending_payment: 'Aguardando Pagamento',
  paid: 'Pagamento Confirmado',
  queued: 'Na Fila',
  assigned: 'Dev Atribuído',
  in_progress: 'Em Desenvolvimento',
  review: 'Em Revisão',
  delivered: 'Entregue',
  completed: 'Concluído',
}

// Replace DashboardProjectStatus with ProjectStage
export type ProjectStage =
  | 'pending_payment'
  | 'briefing'
  | 'agendamento'
  | 'meet_confirmado'
  | 'em_desenvolvimento'
  | 'em_revisao'
  | 'aguardando_dominio'
  | 'entregue'

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  pending_payment:    'Processando pagamento…',
  briefing:           'Briefing',
  agendamento:        'Agendamento do meet',
  meet_confirmado:    'Meet agendado',
  em_desenvolvimento: 'Em desenvolvimento',
  em_revisao:         'Em revisão',
  aguardando_dominio: 'Conexão de domínio',
  entregue:           'Entregue',
}

export interface MeetSlot {
  id: string
  date: string      // 'YYYY-MM-DD'
  hour: string      // '09:00'
  available: boolean
  orderId?: string
  meetLink?: string
}

// Deprecated: use ProjectStage directly. Will be removed after Task 3 migration.
export type DashboardProjectStatus = ProjectStage
export const DASHBOARD_STATUS_LABELS = PROJECT_STAGE_LABELS

export interface CartItem {
  id: string
  productName: string
  productType: string
  projectName: string
  briefing: string
  reference: string
  prazo: '14dias' | '7dias'
  basePrice: number
  finalPrice: number
}

export interface DashboardOrder {
  id: string
  userId: string
  productName: string
  productType: string
  projectName: string
  briefing: string
  reference: string
  prazo: '14dias' | '7dias'
  price: number
  stripeSessionId: string
  deliveryUrl: string | null
  createdAt: Date
  projectStage: ProjectStage
  meetLink: string | null
  meetDate: string | null
  deployUrl: string | null
  revisionPaid: boolean
  developmentStartedAt: Date | null
  briefingNotes?: string
  references?: string[]
  meetSlotId?: string
}
