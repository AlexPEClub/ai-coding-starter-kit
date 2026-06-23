import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { JoinGroupForm } from './JoinGroupForm'

const mockJoinGroup = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({
    joinGroup: mockJoinGroup,
    groups: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
    createGroup: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

function typeInto(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
}

function submitForm() {
  fireEvent.submit(screen.getByRole('button', { name: /gruppe beitreten/i }))
}

describe('JoinGroupForm — Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when code is empty and form submitted', async () => {
    render(<JoinGroupForm />)
    // Empty code → button disabled → test form submit directly
    const form = screen.getByRole('button', { name: /gruppe beitreten/i }).closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText('Bitte gib einen Einladungs-Code ein')).toBeInTheDocument()
    })
    expect(mockJoinGroup).not.toHaveBeenCalled()
  })

  it('submit button is disabled until 6 characters entered', () => {
    render(<JoinGroupForm />)
    const btn = screen.getByRole('button', { name: /gruppe beitreten/i })
    const input = screen.getByRole('textbox')
    expect(btn).toBeDisabled()
    typeInto(input, 'ABCDE')
    expect(btn).toBeDisabled()
    typeInto(input, 'ABCDEF')
    expect(btn).not.toBeDisabled()
  })

  it('converts input to uppercase and strips non-alphanumeric chars', () => {
    render(<JoinGroupForm />)
    const input = screen.getByRole('textbox')
    typeInto(input, 'abc!@#23')
    expect(input).toHaveValue('ABC23')
  })

  it('strips O, 0, I, 1 to prevent visual confusion with valid code chars', () => {
    render(<JoinGroupForm />)
    const input = screen.getByRole('textbox')
    typeInto(input, 'A0B1CI')
    expect(input).toHaveValue('ABC')
  })

  it('truncates input at 6 characters', () => {
    render(<JoinGroupForm />)
    const input = screen.getByRole('textbox')
    typeInto(input, 'ABCDEFGH')
    expect(input).toHaveValue('ABCDEF')
  })

  it('calls joinGroup with the typed 6-char code', async () => {
    mockJoinGroup.mockResolvedValue({ groupId: 'grp-1', error: null })
    const onSuccess = vi.fn()
    render(<JoinGroupForm onSuccess={onSuccess} />)
    typeInto(screen.getByRole('textbox'), 'XJHF42')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(mockJoinGroup).toHaveBeenCalledWith('XJHF42')
    })
  })

  it('calls onSuccess with groupId on successful join', async () => {
    mockJoinGroup.mockResolvedValue({ groupId: 'grp-42', error: null })
    const onSuccess = vi.fn()
    render(<JoinGroupForm onSuccess={onSuccess} />)
    typeInto(screen.getByRole('textbox'), 'ABCDEF')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('grp-42')
    })
  })

  it('shows "Ungültiger Einladungs-Code" for invalid code', async () => {
    mockJoinGroup.mockResolvedValue({ groupId: null, error: 'Ungültiger Einladungs-Code' })
    render(<JoinGroupForm />)
    typeInto(screen.getByRole('textbox'), 'XXXXXX')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(screen.getByText('Ungültiger Einladungs-Code')).toBeInTheDocument()
    })
  })

  it('shows "bereits Mitglied" error for duplicate join', async () => {
    mockJoinGroup.mockResolvedValue({ groupId: null, error: 'Du bist bereits Mitglied dieser Gruppe' })
    render(<JoinGroupForm />)
    typeInto(screen.getByRole('textbox'), 'ABCDEF')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(screen.getByText('Du bist bereits Mitglied dieser Gruppe')).toBeInTheDocument()
    })
  })

  it('clears error when user changes the input after an error', async () => {
    mockJoinGroup.mockResolvedValue({ groupId: null, error: 'Ungültiger Einladungs-Code' })
    render(<JoinGroupForm />)
    typeInto(screen.getByRole('textbox'), 'XXXXXX')
    await act(async () => { submitForm() })
    await waitFor(() => {
      expect(screen.getByText('Ungültiger Einladungs-Code')).toBeInTheDocument()
    })
    typeInto(screen.getByRole('textbox'), 'YYYYYY')
    expect(screen.queryByText('Ungültiger Einladungs-Code')).not.toBeInTheDocument()
  })
})
