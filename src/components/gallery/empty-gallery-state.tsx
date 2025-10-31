import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import type { GalleryStyle } from '@/types';

interface EmptyGalleryStateProps {
  style?: GalleryStyle;
  className?: string;
}

export function EmptyGalleryState({ style, className }: EmptyGalleryStateProps) {
  const t = useTranslations('gallery.empty');
  const tStyles = useTranslations('gallery.styles');

  const title = style ? t('titleWithStyle', { style: tStyles(style) }) : t('title');

  return (
    <div className={className}>
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <Icon name="image" className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        <div className="mt-2 flex gap-2">
          <Button variant="primary" asChild>
            <Link href="/gallery?submit=1">{t('submitSetup')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/gallery">{t('browseAll')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
