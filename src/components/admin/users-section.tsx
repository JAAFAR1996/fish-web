'use client';

import type { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle, Icon } from '@/components/ui';

interface UsersSectionProps {
  admin: User;
  className?: string;
}

export function UsersSection({ admin, className }: UsersSectionProps) {
  void admin;
  const t = useTranslations('admin');

  return (
    <section className={className}>
      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="users" className="h-5 w-5" />
            {t('users.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('users.userDetails')}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
