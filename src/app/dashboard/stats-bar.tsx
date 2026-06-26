type StatsBarProps = {
  open: number
  approved: number
  rejected: number
}

export function StatsBar({ open, approved, rejected }: StatsBarProps) {
  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <span style={{ color: '#8892B0' }}>
        <span className="font-semibold" style={{ color: '#FFFFFF' }}>{open}</span>
        {' '}offen
      </span>
      <span style={{ color: '#1C2340' }}>·</span>
      <span style={{ color: '#8892B0' }}>
        <span className="font-semibold" style={{ color: '#4ADE80' }}>{approved}</span>
        {' '}bestätigt
      </span>
      <span style={{ color: '#1C2340' }}>·</span>
      <span style={{ color: '#8892B0' }}>
        <span className="font-semibold">{rejected}</span>
        {' '}abgelehnt
      </span>
    </div>
  )
}
