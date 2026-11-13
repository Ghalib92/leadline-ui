import {
  Building,
  CalendarDays,
  Cloud,
  FileText,
  HardDrive,
  Mail,
  MessageSquare,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { IntegrationId } from '~/lib/schema';
import { cn } from '~/lib/utils';

/** Brand-tinted mark per integration (lucide glyph, not a trademark logo). */
const MARKS: Record<IntegrationId, { icon: LucideIcon; color: string }> = {
  slack: { icon: MessageSquare, color: '#4A154B' },
  'microsoft-teams': { icon: Users, color: '#5059C9' },
  'email-digest': { icon: Mail, color: '#0F766E' },
  'google-drive': { icon: HardDrive, color: '#1A73E8' },
  notion: { icon: FileText, color: '#37352F' },
  hubspot: { icon: Building, color: '#FF7A59' },
  salesforce: { icon: Cloud, color: '#00A1E0' },
  'google-calendar': { icon: CalendarDays, color: '#1967D2' },
  zapier: { icon: Zap, color: '#FF4F00' },
};

export function IntegrationLogo({
  id,
  size = 'md',
}: Readonly<{ id: IntegrationId; size?: 'md' | 'lg' }>) {
  const { icon: Icon, color } = MARKS[id];
  return (
    <span
      aria-hidden="true"
      // Per-brand tint is data, not a class variant, so it goes inline.
      style={{ backgroundColor: `${color}1A`, color }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10',
        size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
      )}
    >
      <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
    </span>
  );
}
