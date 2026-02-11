import { icons } from 'lucide-react'

interface LucideIconProps {
  name: string
  size?: number
  className?: string
}

export function LucideIcon({ name, size = 16, className }: LucideIconProps) {
  const iconName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof icons

  const IconComponent = icons[iconName] ?? icons['Circle']

  return <IconComponent size={size} className={className} />
}
