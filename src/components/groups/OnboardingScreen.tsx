'use client'

import { useState } from 'react'
import { CreateGroupForm } from './CreateGroupForm'
import { JoinGroupForm } from './JoinGroupForm'
import { Users, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type Panel = 'choose' | 'create' | 'join'

interface OnboardingScreenProps {
  onSuccess?: (groupId: string) => void
}

export function OnboardingScreen({ onSuccess }: OnboardingScreenProps) {
  const [panel, setPanel] = useState<Panel>('choose')
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-3">
            Willkommen
          </span>
          <h1 className="text-[28px] font-black text-ink leading-tight">
            {panel === 'choose'
              ? 'Starte jetzt'
              : panel === 'create'
              ? 'Neue Gruppe'
              : 'Gruppe beitreten'}
          </h1>
          <p className="text-[15px] text-ink-2">
            {panel === 'choose'
              ? 'Erstelle eine Gruppe oder tritt einer bestehenden bei.'
              : panel === 'create'
              ? 'Wähle einen Namen für deine Gruppe.'
              : 'Gib den Code ein, den du von der Gruppe erhalten hast.'}
          </p>
        </div>

        {/* Content */}
        {panel === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setPanel('create')}
              className="w-full bg-surface border border-line rounded-[18px] p-5 text-left
                         flex items-center gap-4 hover:border-primary hover:shadow-md
                         transition-all duration-150 active:scale-[0.98] group"
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-pill bg-primary-soft flex items-center justify-center group-hover:bg-primary transition-colors">
                <Users className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
              </span>
              <div>
                <p className="text-[16px] font-bold text-ink">Gruppe erstellen</p>
                <p className="text-[13px] text-ink-2 mt-0.5">
                  Starte eine neue Gruppe und lade Freunde ein
                </p>
              </div>
            </button>

            <button
              onClick={() => setPanel('join')}
              className="w-full bg-surface border border-line rounded-[18px] p-5 text-left
                         flex items-center gap-4 hover:border-secondary hover:shadow-md
                         transition-all duration-150 active:scale-[0.98] group"
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-pill bg-secondary-soft flex items-center justify-center group-hover:bg-secondary transition-colors">
                <UserPlus className="h-5 w-5 text-secondary group-hover:text-white transition-colors" />
              </span>
              <div>
                <p className="text-[16px] font-bold text-ink">Gruppe beitreten</p>
                <p className="text-[13px] text-ink-2 mt-0.5">
                  Tritt mit einem Einladungs-Code bei
                </p>
              </div>
            </button>
          </div>
        )}

        {panel === 'create' && (
          <div className="bg-surface border border-line rounded-[18px] p-6">
            <CreateGroupForm onSuccess={onSuccess} />
          </div>
        )}

        {panel === 'join' && (
          <div className="bg-surface border border-line rounded-[18px] p-6">
            <JoinGroupForm onSuccess={onSuccess} />
          </div>
        )}

        {/* Back link */}
        {panel !== 'choose' && (
          <button
            onClick={() => setPanel('choose')}
            className="w-full text-center text-[13px] text-ink-3 hover:text-ink-2 transition-colors py-1"
          >
            ← Zurück
          </button>
        )}

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full text-center text-[12px] text-ink-3 hover:text-ink-2 transition-colors py-1"
        >
          Ausloggen
        </button>
      </div>
    </div>
  )
}
