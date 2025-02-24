'use client'

import {
  RiUserLine,
  RiUserStarLine,
  RiUserSettingsLine,
  RiMusicLine,
} from 'react-icons/ri'

export type IconProps = {
  className?: string
}

export const UserIcon = ({ className }: IconProps) => {
  return <RiUserLine className={className} />
}

export const UserLoggedInIcon = ({ className }: IconProps) => {
  return <RiUserStarLine className={className} />
}

export const AdminIcon = ({ className }: IconProps) => {
  return <RiUserSettingsLine className={className} />
}

export const MusicIcon = ({ className }: IconProps) => {
  return <RiMusicLine className={className} />
}
