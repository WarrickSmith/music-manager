export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-grow items-center justify-center py-8">
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-white dark:bg-gray-800">
        {children}
      </div>
    </div>
  )
}
