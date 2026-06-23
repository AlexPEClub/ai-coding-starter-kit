import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CreateGroupForm } from './CreateGroupForm'

const mockCreateGroup = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({
    createGroup: mockCreateGroup,
    groups: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    joinGroup: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
}

function submitForm() {
  fireEvent.submit(screen.getByRole('button', { name: /gruppe erstellen/i }))
}

describe('CreateGroupForm — Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when name is empty', async () => {
    render(<CreateGroupForm />)
    submitForm()
    await waitFor(() => {
      expect(screen.getByText('Gruppenname ist erforderlich')).toBeInTheDocument()
    })
    expect(mockCreateGroup).not.toHaveBeenCalled()
  })

  it('shows error when name is whitespace-only', async () => {
    render(<CreateGroupForm />)
    typeInto(screen.getByRole('textbox'), '   ')
    submitForm()
    await waitFor(() => {
      expect(screen.getByText('Gruppenname ist erforderlich')).toBeInTheDocument()
    })
    expect(mockCreateGroup).not.toHaveBeenCalled()
  })

  it('shows error when name exceeds 50 characters', async () => {
    render(<CreateGroupForm />)
    typeInto(screen.getByRole('textbox'), 'A'.repeat(51))
    submitForm()
    await waitFor(() => {
      expect(screen.getByText('Gruppenname darf maximal 50 Zeichen lang sein')).toBeInTheDocument()
    })
    expect(mockCreateGroup).not.toHaveBeenCalled()
  })

  it('shows character counter', () => {
    render(<CreateGroupForm />)
    expect(screen.getByText('0/50 Zeichen')).toBeInTheDocument()
    typeInto(screen.getByRole('textbox'), 'Test')
    expect(screen.getByText('4/50 Zeichen')).toBeInTheDocument()
  })

  it('calls createGroup with trimmed name on valid submit', async () => {
    mockCreateGroup.mockResolvedValue({ groupId: 'abc-123', error: null })
    const onSuccess = vi.fn()
    render(<CreateGroupForm onSuccess={onSuccess} />)
    typeInto(screen.getByRole('textbox'), '  Schulfreunde  ')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith('Schulfreunde')
    })
  })

  it('calls onSuccess with groupId after successful creation', async () => {
    mockCreateGroup.mockResolvedValue({ groupId: 'group-42', error: null })
    const onSuccess = vi.fn()
    render(<CreateGroupForm onSuccess={onSuccess} />)
    typeInto(screen.getByRole('textbox'), 'WG-Crew')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('group-42')
    })
  })

  it('displays server error when createGroup returns error', async () => {
    mockCreateGroup.mockResolvedValue({ groupId: null, error: 'Verbindungsfehler' })
    render(<CreateGroupForm />)
    typeInto(screen.getByRole('textbox'), 'Test Gruppe')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(screen.getByText('Verbindungsfehler')).toBeInTheDocument()
    })
  })

  it('clears validation error when user changes input', async () => {
    render(<CreateGroupForm />)
    submitForm()
    await waitFor(() => {
      expect(screen.getByText('Gruppenname ist erforderlich')).toBeInTheDocument()
    })
    typeInto(screen.getByRole('textbox'), 'A')
    expect(screen.queryByText('Gruppenname ist erforderlich')).not.toBeInTheDocument()
  })
})
