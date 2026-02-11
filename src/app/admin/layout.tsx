export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col min-h-screen">
      {children}
    </section>
  )
}