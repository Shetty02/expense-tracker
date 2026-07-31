import {
  Utensils,
  ShoppingCart,
  Film,
  Shirt,
  Plane,
  Receipt,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  History,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Edit,
  Trash2,
  X,
  TrendingUp,
  Sparkles,
  ChevronDown,
  User,
  Activity,
  ArrowRight,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Train,
  LineChart,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react'

export const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  ShoppingCart,
  Film,
  Shirt,
  Plane,
  Receipt,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  History,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Edit,
  Trash2,
  X,
  TrendingUp,
  Sparkles,
  ChevronDown,
  User,
  Activity,
  ArrowRight,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Train,
  LineChart,
  ShieldCheck,
  HeartHandshake
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = IconMap[name] || HelpCircle
  return <IconComponent className={className} />
}

export const CategoryColorMap: Record<string, string> = {
  'Food': '#f59e0b', // Amber
  'Groceries': '#10b981', // Emerald
  'Movies & Entertainment': '#8b5cf6', // Violet
  'Clothes': '#ec4899', // Pink
  'Travel': '#3b82f6', // Blue
  'Bills & Utilities': '#eab308', // Yellow
  'Health': '#ef4444', // Red
  'Other': '#6b7280', // Grey
  'Mutual Funds': '#6366f1', // Indigo
  'Stocks': '#a855f7', // Purple
  'Term Insurance': '#14b8a6', // Teal
  'Health Insurance': '#f43f5e', // Rose
}

export const CategoryBadgeClasses: Record<string, { bg: string; border: string; text: string }> = {
  'Food': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  'Groceries': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  'Movies & Entertainment': { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
  'Clothes': { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
  'Travel': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  'Bills & Utilities': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  'Health': { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  'Other': { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400' },
  'Mutual Funds': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  'Stocks': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  'Term Insurance': { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400' },
  'Health Insurance': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
}
