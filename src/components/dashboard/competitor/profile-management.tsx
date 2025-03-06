export default function ProfileManagement({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
}: {
  userId: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-violet-500">
        My Profile
      </h2>
      <p className="text-violet-400">
        This section will allow you to manage your profile information.
      </p>
    </div>
  )
}
