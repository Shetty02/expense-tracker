import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatNumberWithCommas(value: string | number): string {
  if (value === undefined || value === null || value === '') return ''
  const cleanValue = String(value).replace(/,/g, '')
  if (isNaN(Number(cleanValue))) return String(value)
  const parts = cleanValue.split('.')
  parts[0] = Number(parts[0]).toLocaleString('en-IN')
  return parts.join('.')
}
