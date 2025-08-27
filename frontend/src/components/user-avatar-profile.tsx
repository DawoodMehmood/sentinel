// src/components/user-avatar-profile.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type NextAuthUser = {
  image?: string | null;
  name?: string | null;
  email?: string | null;
};

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
  user: NextAuthUser | null;
}

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
    return (first + second).toUpperCase() || 'U';
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

export function UserAvatarProfile({
  className,
  showInfo = false,
  user,
}: UserAvatarProfileProps) {
  const img = user?.image ?? '';
  const name = user?.name ?? '';
  const email = user?.email ?? '';
  const initials = getInitials(name, email);
  const alt = name || email || 'User';

  return (
    <div className="flex items-center gap-2">
      <Avatar className={className}>
        {/* Avoid broken image icon if empty */}
        {img ? <AvatarImage src={img} alt={alt} /> : null}
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{name || email || 'User'}</span>
          <span className="truncate text-xs">{email}</span>
        </div>
      )}
    </div>
  );
}
