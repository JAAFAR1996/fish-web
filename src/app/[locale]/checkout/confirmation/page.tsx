import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/types';
import { getOrderForConfirmation } from '@/lib/checkout/checkout-actions';
import { formatCurrency } from '@/lib/utils';
import { getEstimatedDeliveryDays } from '@/lib/checkout/shipping-rates';
import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';

type ConfirmationPageProps = {
  params: { locale: string };
  searchParams: { order?: string };
};

export async function generateMetadata({
  params,
}: ConfirmationPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'orderConfirmation' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      languages: {
        ar: '/ar/checkout/confirmation',
        en: '/en/checkout/confirmation',
      },
    },
  };
}

export default async function CheckoutConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const orderNumber = searchParams.order;
  if (!orderNumber) {
    redirect(`/${locale}`);
  }

  const order = await getOrderForConfirmation(orderNumber);
  if (!order) {
    notFound();
  }

  const resolvedLocale: Locale = locale === 'ar' ? 'ar' : 'en';
  const t = await getTranslations('orderConfirmation');
  const tSummary = await getTranslations('checkout.summary');
  const tShippingCost = await getTranslations('checkout.shippingCost');
  const tPayment = await getTranslations('checkout.payment');

  const confirmationEmail = order.guest_email ?? null;
  const estimatedDays = getEstimatedDeliveryDays(order.shipping_address.governorate);
  const deliveryDate = new Date(order.created_at);
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
  const formattedDeliveryDate = new Intl.DateTimeFormat(
    resolvedLocale === 'ar' ? 'ar-IQ' : 'en-US',
    { dateStyle: 'medium' }
  ).format(deliveryDate);

  const orderDate = new Intl.DateTimeFormat(
    resolvedLocale === 'ar' ? 'ar-IQ' : 'en-US',
    { dateStyle: 'medium' }
  ).format(new Date(order.created_at));

  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const summaryLines: Array<{ label: string; value: string }> = [
    {
      label: tSummary('shipping'),
      value:
        Number(order.shipping_cost) === 0
          ? tShippingCost('free')
          : formatCurrency(Number(order.shipping_cost), resolvedLocale),
    },
  ];

  if (Number(order.discount) > 0) {
    summaryLines.push({
      label: tSummary('discount'),
      value: `- ${formatCurrency(Number(order.discount), resolvedLocale)}`,
    });
  }

  const totalFormatted = formatCurrency(Number(order.total), resolvedLocale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aqua-500 text-white">
          <Icon name="check" className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          {t('thankYou')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t('orderPlaced')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>
            {t('orderNumber')}: <span className="font-semibold text-foreground">{order.order_number}</span>
          </span>
          <span>
            {t('orderDate')}: <span className="font-semibold text-foreground">{orderDate}</span>
          </span>
          <span>
            {t('estimatedDelivery')}:{' '}
            <span className="font-semibold text-foreground">
              {t('deliveryDays', { days: estimatedDays })} - {formattedDeliveryDate}
            </span>
          </span>
        </div>
        {confirmationEmail ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('emailSent', { email: confirmationEmail })}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t('checkEmail')}</p>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {t('details.items')}
            </h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                    <Image
                      src={item.product_snapshot.thumbnail}
                      alt={item.product_snapshot.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {item.product_snapshot.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tSummary('itemsCount', { count: item.quantity })}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatCurrency(Number(item.subtotal), resolvedLocale)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {t('details.shippingAddress')}
            </h2>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {order.shipping_address.recipient_name}
              </p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p>{order.shipping_address.address_line2}</p>
              )}
              <p>
                {order.shipping_address.city}, {order.shipping_address.governorate}
              </p>
              {order.shipping_address.postal_code && (
                <p>{order.shipping_address.postal_code}</p>
              )}
              {order.shipping_address.phone && (
                <p>{order.shipping_address.phone}</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {t('details.paymentMethod')}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {order.payment_method === 'cod'
                ? tPayment('cod')
                : order.payment_method}
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {t('details.orderSummary')}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {tSummary('itemsCount', { count: itemsCount })}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(Number(order.subtotal), resolvedLocale)}
                </span>
              </div>
              {summaryLines.map((line) => (
                <div key={line.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium text-foreground">{line.value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 text-base font-semibold">
                <div className="flex items-center justify-between">
                  <span>{tSummary('total')}</span>
                  <span>{totalFormatted}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-3">
            <Button asChild variant="primary" className="w-full">
              <Link href={`/${locale}/products`}>{t('actions.continueShopping')}</Link>
            </Button>
            {order.user_id && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${locale}/account?tab=orders`}>
                  {t('actions.viewOrders')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
