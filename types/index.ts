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
