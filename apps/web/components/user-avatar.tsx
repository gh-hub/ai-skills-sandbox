import { cn } from "@/lib/utils"

const AVATAR_SIZE_CLASSES = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
} as const

export type UserAvatarSize = keyof typeof AVATAR_SIZE_CLASSES

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return ""
  }

  const firstInitial = words[0]?.[0] ?? ""
  const lastInitial = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : ""

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

export function UserAvatar({
  name,
  size = "md",
  className,
}: {
  name: string
  size?: UserAvatarSize
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground",
        AVATAR_SIZE_CLASSES[size],
        className
      )}
      aria-hidden="true"
      title={name}
    >
      {getInitials(name)}
    </span>
  )
}
