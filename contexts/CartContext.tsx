'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { CartItem } from '@/types'

const STORAGE_KEY = 'crably_cart'

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<Omit<CartItem, 'id'>>) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateItem: () => {},
  clearCart: () => {},
})

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage full or unavailable
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  useEffect(() => {
    saveCart(items)
  }, [items])

  function addItem(item: Omit<CartItem, 'id'>) {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { ...item, id }])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateItem(id: string, updates: Partial<Omit<CartItem, 'id'>>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  function clearCart() {
    setItems([])
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
