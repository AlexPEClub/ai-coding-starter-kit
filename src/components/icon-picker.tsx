'use client'

import { useState, useMemo } from 'react'
import { icons } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Curated list of relevant icons for a service/industry context
const CURATED_ICONS = [
  'wrench', 'cog', 'cable', 'droplet', 'truck',
  'hammer', 'settings', 'zap', 'factory', 'gauge',
  'pipette', 'shield', 'hard-hat', 'thermometer', 'fuel',
  'bolt', 'plug', 'construction', 'drill', 'scissors',
  'box', 'package', 'warehouse', 'forklift', 'container',
  'map-pin', 'phone', 'mail', 'globe', 'clock',
  'check-circle', 'star', 'heart', 'alert-triangle', 'info',
  'tool', 'ruler', 'scan', 'circle', 'square',
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

function LucideIcon({ name, className }: { name: string; className?: string }) {
  const iconName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof icons

  const IconComponent = icons[iconName]
  if (!IconComponent) {
    const Fallback = icons['Circle']
    return <Fallback className={className} />
  }
  return <IconComponent className={className} />
}

export { LucideIcon }

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = useMemo(() => {
    const allIconNames = Object.keys(icons).map((name) =>
      name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)
    )

    const iconList = search.length > 0 ? allIconNames : CURATED_ICONS

    if (!search) return iconList

    return iconList.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <LucideIcon name={value} className="h-4 w-4" />
          <span className="truncate">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Icon suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-1 p-2">
            {filteredIcons.slice(0, 120).map((name) => (
              <button
                key={name}
                type="button"
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent',
                  value === name && 'bg-accent ring-2 ring-primary'
                )}
                title={name}
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                  setSearch('')
                }}
              >
                <LucideIcon name={name} className="h-4 w-4" />
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Kein Icon gefunden
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
