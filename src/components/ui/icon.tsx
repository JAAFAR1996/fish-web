'use client';

import { useLocale } from 'next-intl';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Beaker,
  Bell,
  BellDot,
  BellRing,
  Bookmark,
  Calculator,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  BookOpen,
  Copy,
  CreditCard,
  FileText,
  Droplet,
  Download,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Facebook,
  Filter,
  Gauge,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  List,
  Instagram,
  Loader2,
  LogOut,
  Lock,
  Gift,
  Sparkles,
  RefreshCcw,
  Zap,
  Menu,
  MessageCircle,
  Mic,
  Minus,
  Moon,
  Package,
  Smartphone,
  Phone,
  Plus,
  Play,
  Save,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
  WifiOff,
  ThumbsDown,
  ThumbsUp,
  Sun,
  Tag,
  Thermometer,
  Trash2,
  Truck,
  Twitter,
  Upload,
  User,
  X,
  Youtube,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';
import { ICON_SIZES, type Size } from './variants';

const iconRegistry = {
  activity: Activity,
  alert: AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  beaker: Beaker,
  bell: Bell,
  'bell-dot': BellDot,
  'bell-ring': BellRing,
  bookmark: Bookmark,
  calculator: Calculator,
  cart: ShoppingCart,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  close: X,
  copy: Copy,
  'external-link': ExternalLink,
  'credit-card': CreditCard,
  droplet: Droplet,
  edit: Edit,
  eye: Eye,
  'eye-off': EyeOff,
  facebook: Facebook,
  filter: Filter,
  gauge: Gauge,
  clock: Clock,
  heart: Heart,
  help: HelpCircle,
  image: ImageIcon,
  instagram: Instagram,
  loader: Loader2,
  logout: LogOut,
  lock: Lock,
  maximize: Maximize,
  menu: Menu,
  minus: Minus,
  minimize: Minimize,
  moon: Moon,
  package: Package,
  phone: Phone,
  plus: Plus,
  play: Play,
  save: Save,
  search: Search,
  settings: Settings,
  share: Share2,
  'shield-check': ShieldCheck,
  'file-text': FileText,
  book: BookOpen,
  mic: Mic,
  star: Star,
  'thumbs-down': ThumbsDown,
  'thumbs-up': ThumbsUp,
  sun: Sun,
  tag: Tag,
  thermometer: Thermometer,
  upload: Upload,
  trash: Trash2,
  truck: Truck,
  twitter: Twitter,
  user: User,
  whatsapp: MessageCircle,
  youtube: Youtube,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  list: List,
  gift: Gift,
  sparkles: Sparkles,
  'refresh-ccw': RefreshCcw,
  users: Users,
  download: Download,
  'smartphone': Smartphone,
  'wifi-off': WifiOff,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconRegistry;

export type IconProps = Omit<LucideProps, 'size'> & {
  name: IconName;
  size?: Size | number;
  flipRtl?: boolean;
  className?: string;
};

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = 'md', className, flipRtl = false, 'aria-hidden': ariaHidden, ...props },
  ref
) {
  const locale = useLocale();
  const IconComponent = iconRegistry[name] ?? HelpCircle;
  const resolvedSize =
    typeof size === 'number' ? size : ICON_SIZES[size] ?? ICON_SIZES.md;

  return (
    <IconComponent
      ref={ref}
      size={resolvedSize}
      className={cn(
        flipRtl && locale === 'ar' && 'rtl-flip',
        className
      )}
      aria-hidden={ariaHidden ?? true}
      {...props}
    />
  );
});
