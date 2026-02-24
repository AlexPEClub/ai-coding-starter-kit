export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <div className="w-full max-w-sm px-4">
                {children}
            </div>
        </div>
    )
}
