'use client'

import { createContext, useContext, useState } from 'react'

const AddExpenseContext = createContext<{
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
})

export function AddExpenseProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <AddExpenseContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </AddExpenseContext.Provider>
  )
}

export const useAddExpenseModal = () => useContext(AddExpenseContext)
