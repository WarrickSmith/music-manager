'use client'

import ProfileManagement from '../profile-management'

export default function CompetitorProfileManagement({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
}: {
  userId: string
}) {
  return <ProfileManagement role="competitor" />
}
