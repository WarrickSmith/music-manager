export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-grow items-center justify-center px-4 py-8">
      <div className="app-panel w-full max-w-md p-8">{children}</div>
    </div>
  )
}
