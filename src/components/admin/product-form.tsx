'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Icon,
  Input,
} from '@/components/ui';
import type { Product, ProductFormData, ProductSpecifications, ImageUploadPreview } from '@/types';
import { createProductAction, updateProductAction } from '@/lib/admin/product-actions';
import { validateProductForm } from '@/lib/admin/validation';
import { cn } from '@/lib/utils';
import { ImageUploadInput } from '@/components/reviews/image-upload-input';
import { uploadProductImage } from '@/lib/admin/image-upload';
import { MAX_PRODUCT_IMAGES } from '@/lib/admin/constants';
import { slugify } from '@/lib/blog/content-utils';

interface ProductFormProps {
  existingProduct: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
  className?: string;
}

type FormErrors = Record<string, string>;

const DEFAULT_SPECIFICATIONS: ProductSpecifications = {
  flow: null,
  power: null,
  compatibility: {
    minTankSize: null,
    maxTankSize: null,
    displayText: '',
  },
  dimensions: null,
  weight: null,
};

const toPreview = (images: string[]): ImageUploadPreview[] =>
  images.map((url) => ({
    file: null,
    preview: url,
    uploading: false,
    uploaded: true,
    url,
    error: null,
  }));

const getInitialSpecifications = (product: Product | null): ProductSpecifications =>
  product?.specifications
    ? {
        flow: product.specifications.flow,
        power: product.specifications.power,
        compatibility: {
          minTankSize: product.specifications.compatibility.minTankSize,
          maxTankSize: product.specifications.compatibility.maxTankSize,
          displayText: product.specifications.compatibility.displayText ?? '',
        },
        dimensions: product.specifications.dimensions
          ? { ...product.specifications.dimensions }
          : null,
        weight: product.specifications.weight,
      }
    : DEFAULT_SPECIFICATIONS;

export function ProductForm({
  existingProduct,
  onSuccess,
  onCancel,
  className,
}: ProductFormProps) {
  const t = useTranslations('admin');
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [name, setName] = useState(existingProduct?.name ?? '');
  const [brand, setBrand] = useState(existingProduct?.brand ?? '');
  const [category, setCategory] = useState(existingProduct?.category ?? '');
  const [subcategory, setSubcategory] = useState(existingProduct?.subcategory ?? '');
  const [description, setDescription] = useState(existingProduct?.description ?? '');
  const [price, setPrice] = useState<number>(existingProduct?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState<number | null>(
    existingProduct?.originalPrice ?? null,
  );
  const [stock, setStock] = useState<number>(existingProduct?.stock ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(
    existingProduct?.lowStockThreshold ?? 5,
  );
  const [isNew, setIsNew] = useState(existingProduct?.isNew ?? false);
  const [isBestSeller, setIsBestSeller] = useState(existingProduct?.isBestSeller ?? false);
  const [specifications, setSpecifications] = useState<ProductSpecifications>(
    getInitialSpecifications(existingProduct),
  );
  const [imagePreviews, setImagePreviews] = useState<ImageUploadPreview[]>(
    existingProduct ? toPreview(existingProduct.images) : [],
  );

  useEffect(() => {
    if (statusMessage) {
      const timeout = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [statusMessage]);

  const translateKey = useCallback(
    (key: string) => {
      const normalized = key.startsWith('admin.') ? key.slice('admin.'.length) : key;
      return t(normalized as Parameters<typeof t>[0]);
    },
    [t],
  );

  const uploadSlugRef = useRef(
    existingProduct?.slug ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `product-${Date.now()}`),
  );
  const uploadQueueRef = useRef(0);

  const resolveUploadSlug = useCallback(() => {
    const trimmedName = name.trim();
    if (trimmedName) {
      const generated = slugify(trimmedName);
      if (generated) {
        uploadSlugRef.current = generated;
        return generated;
      }
    }
    return uploadSlugRef.current;
  }, [name]);

  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleImagesChange = useCallback(
    async (nextImages: ImageUploadPreview[]) => {
      setErrors((prev) => {
        if (!prev.images) {
          return prev;
        }
        const nextErrors = { ...prev };
        delete nextErrors.images;
        return nextErrors;
      });

      const pendingUploads = nextImages.filter((preview) => preview.file && !preview.uploaded);

      if (pendingUploads.length === 0) {
        setImagePreviews(nextImages);
        return;
      }

      const slug = resolveUploadSlug();
      const preparedPreviews = nextImages.map((preview) =>
        preview.file && !preview.uploaded
          ? { ...preview, uploading: true, error: null }
          : preview,
      );

      setImagePreviews(preparedPreviews);
      uploadQueueRef.current += pendingUploads.length;
      setIsUploadingImages(true);

      await Promise.all(
        pendingUploads.map(async (pendingPreview) => {
          const previewKey = pendingPreview.preview;

          try {
            const result = await uploadProductImage(pendingPreview.file!, slug);

            setImagePreviews((prev) =>
              prev.map((preview) => {
                if (preview.preview !== previewKey) {
                  return preview;
                }

                if (result.url) {
                  return {
                    ...preview,
                    file: null,
                    preview: result.url,
                    url: result.url,
                    uploading: false,
                    uploaded: true,
                    error: null,
                  };
                }

                return {
                  ...preview,
                  uploading: false,
                  uploaded: false,
                  error: translateKey(result.error ?? 'errors.imageUploadFailed'),
                };
              }),
            );

            if (!result.url && result.error) {
              setStatusMessage(result.error);
            }
          } catch (error) {
            console.error('Failed to upload product image', error);
            setImagePreviews((prev) =>
              prev.map((preview) =>
                preview.preview === previewKey
                  ? {
                      ...preview,
                      uploading: false,
                      uploaded: false,
                      error: translateKey('errors.imageUploadFailed'),
                    }
                  : preview,
              ),
            );
            setStatusMessage('errors.imageUploadFailed');
          } finally {
            uploadQueueRef.current = Math.max(uploadQueueRef.current - 1, 0);
            if (uploadQueueRef.current === 0) {
              setIsUploadingImages(false);
            }
          }
        }),
      );
    },
    [resolveUploadSlug, translateKey],
  );

  const uploadedImages = useMemo(
    () => imagePreviews.filter((preview) => Boolean(preview.url)).map((preview) => preview.url!),
    [imagePreviews],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setStatusMessage(null);

    if (isUploadingImages || imagePreviews.some((preview) => preview.uploading)) {
      setStatusMessage('errors.imageUploadInProgress');
      return;
    }

    if (imagePreviews.some((preview) => preview.error && !preview.url)) {
      setStatusMessage('errors.imageUploadFailed');
      return;
    }

    const payload: ProductFormData = {
      name,
      brand,
      category,
      subcategory,
      description,
      price,
      originalPrice,
      currency: 'IQD',
      images: uploadedImages,
      thumbnail: uploadedImages[0] ?? existingProduct?.thumbnail ?? '',
      stock,
      lowStockThreshold,
      isNew,
      isBestSeller,
      specifications,
    };

    const validation = validateProductForm(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setStatusMessage('errors.productValidation');
      return;
    }

    startTransition(async () => {
      const response = existingProduct
        ? await updateProductAction(existingProduct.id, payload)
        : await createProductAction(payload);

      if (!response.success) {
        const fallbackError = existingProduct
          ? 'errors.productUpdateFailed'
          : 'errors.productCreateFailed';
        setStatusMessage(response.error ?? fallbackError);
        return;
      }

      setStatusMessage(null);
      onSuccess();
    });
  };

  const handleSpecificationChange = <K extends keyof ProductSpecifications>(
    key: K,
    value: ProductSpecifications[K],
  ) => {
    setSpecifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-8', className)}>
      <Card>
        <CardHeader>
          <CardTitle>{t('products.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('products.productDetails')}</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('products.productDetails')}
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{translateKey(errors.name)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('products.brand') ?? 'Brand'}</label>
            <Input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder={t('products.brand') ?? 'Brand'}
            />
            {errors.brand && (
              <p className="text-xs text-destructive">{translateKey(errors.brand)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('products.category') ?? 'Category'}</label>
            <Input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder={t('products.category') ?? 'Category'}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{translateKey(errors.category)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('products.subcategory') ?? 'Subcategory'}
            </label>
            <Input
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              placeholder={t('products.subcategory') ?? 'Subcategory'}
            />
            {errors.subcategory && (
              <p className="text-xs text-destructive">{translateKey(errors.subcategory)}</p>
            )}
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium">{t('products.description') ?? 'Description'}</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm transition focus:border-aqua-500 focus:outline-none focus:ring-2 focus:ring-aqua-200"
              placeholder={t('products.description') ?? 'Description'}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{translateKey(errors.description)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.pricing')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('products.pricing')}</label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
            />
            {errors.price && (
              <p className="text-xs text-destructive">{translateKey(errors.price)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('products.originalPrice')}</label>
            <Input
              type="number"
              min={0}
              value={originalPrice ?? ''}
              onChange={(event) =>
                setOriginalPrice(
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
            {errors.originalPrice && (
              <p className="text-xs text-destructive">{translateKey(errors.originalPrice)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.inventory')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('inventory.updateStock')}</label>
            <Input
              type="number"
              min={0}
              value={stock}
              onChange={(event) => setStock(Number(event.target.value))}
            />
            {errors.stock && (
              <p className="text-xs text-destructive">{translateKey(errors.stock)}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('inventory.lowStockAlert')}</label>
            <Input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(event) => setLowStockThreshold(Number(event.target.value))}
            />
            {errors.lowStockThreshold && (
              <p className="text-xs text-destructive">{translateKey(errors.lowStockThreshold)}</p>
            )}
          </div>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isNew}
              onCheckedChange={(checked) => setIsNew(Boolean(checked))}
            />
            <span className="text-sm">{t('products.isNew') ?? 'New arrival'}</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isBestSeller}
              onCheckedChange={(checked) => setIsBestSeller(Boolean(checked))}
            />
            <span className="text-sm">{t('products.isBestSeller') ?? 'Best seller'}</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.specifications')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Flow (L/H)</label>
            <Input
              type="number"
              value={specifications.flow ?? ''}
              onChange={(event) =>
                handleSpecificationChange(
                  'flow',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Power (W)</label>
            <Input
              type="number"
              value={specifications.power ?? ''}
              onChange={(event) =>
                handleSpecificationChange(
                  'power',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Min Tank Size (L)</label>
            <Input
              type="number"
              value={specifications.compatibility.minTankSize ?? ''}
              onChange={(event) =>
                setSpecifications((prev) => ({
                  ...prev,
                  compatibility: {
                    ...prev.compatibility,
                    minTankSize:
                      event.target.value === '' ? null : Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Max Tank Size (L)</label>
            <Input
              type="number"
              value={specifications.compatibility.maxTankSize ?? ''}
              onChange={(event) =>
                setSpecifications((prev) => ({
                  ...prev,
                  compatibility: {
                    ...prev.compatibility,
                    maxTankSize:
                      event.target.value === '' ? null : Number(event.target.value),
                  },
                }))
              }
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium">Compatibility</label>
            <Input
              value={specifications.compatibility.displayText ?? ''}
              onChange={(event) =>
                setSpecifications((prev) => ({
                  ...prev,
                  compatibility: {
                    ...prev.compatibility,
                    displayText: event.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Weight (kg)</label>
            <Input
              type="number"
              value={specifications.weight ?? ''}
              onChange={(event) =>
                handleSpecificationChange(
                  'weight',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Dimensions (L × W × H)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                placeholder="L"
                value={specifications.dimensions?.length ?? ''}
                onChange={(event) =>
                  setSpecifications((prev) => ({
                    ...prev,
                    dimensions: {
                      length:
                        event.target.value === ''
                          ? 0
                          : Number(event.target.value),
                      width: prev.dimensions?.width ?? 0,
                      height: prev.dimensions?.height ?? 0,
                    },
                  }))
                }
              />
              <Input
                type="number"
                min={0}
                placeholder="W"
                value={specifications.dimensions?.width ?? ''}
                onChange={(event) =>
                  setSpecifications((prev) => ({
                    ...prev,
                    dimensions: {
                      length: prev.dimensions?.length ?? 0,
                      width:
                        event.target.value === ''
                          ? 0
                          : Number(event.target.value),
                      height: prev.dimensions?.height ?? 0,
                    },
                  }))
                }
              />
              <Input
                type="number"
                min={0}
                placeholder="H"
                value={specifications.dimensions?.height ?? ''}
                onChange={(event) =>
                  setSpecifications((prev) => ({
                    ...prev,
                    dimensions: {
                      length: prev.dimensions?.length ?? 0,
                      width: prev.dimensions?.width ?? 0,
                      height:
                        event.target.value === ''
                          ? 0
                          : Number(event.target.value),
                    },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('products.images')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploadInput
            images={imagePreviews}
            onChange={handleImagesChange}
            maxImages={MAX_PRODUCT_IMAGES}
            disabled={isUploadingImages || isPending}
            className="w-full"
          />
        </CardContent>
      </Card>

      {statusMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {translateKey(statusMessage)}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending || isUploadingImages}>
          {(isPending || isUploadingImages) && (
            <Icon name="loader-2" className="me-2 h-4 w-4 animate-spin" />
          )}
          {existingProduct ? t('products.productUpdated') : t('products.productCreated')}
        </Button>
      </div>
    </form>
  );
}
