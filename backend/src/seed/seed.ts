/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import { connectDatabase, disconnectDatabase } from '../infra/db/mongoose';
import { env } from '../config/env';
import { User } from '../modules/users/user.model';
import { Category } from '../modules/categories/category.model';
import { Brand } from '../modules/brands/brand.model';
import { Product } from '../modules/products/product.model';
import { Coupon, DISCOUNT_TYPE } from '../modules/coupons/coupon.model';
import { ROLES } from '../common/constants/roles';

interface SeedProduct {
  name: string;
  sku: string;
  barcode?: string;
  categoryName: string;
  brandName: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number | null;
  discountPercentage: number;
  unit: string;
  weight?: number;
  images: { url: string; alt?: string; isPrimary?: boolean }[];
  thumbnail?: string;
  stock: number;
  lowStockThreshold: number;
  tags: string[];
  nutrition?: Record<string, unknown>;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnDeal?: boolean;
  isFlashSale?: boolean;
}

interface SeedData {
  categories: { name: string; description?: string; icon?: string; isFeatured?: boolean }[];
  brands: { name: string; isFeatured?: boolean }[];
  products: SeedProduct[];
}

/**
 * Attempts to enrich the dataset from a live public API (DummyJSON groceries).
 * Falls back silently to the bundled offline dataset when there is no network.
 */
async function tryFetchLiveGroceries(): Promise<SeedProduct[] | null> {
  try {
    const res = await fetch('https://dummyjson.com/products/category/groceries?limit=50');
    if (!res.ok) return null;
    const json = (await res.json()) as { products: Array<Record<string, unknown>> };
    if (!Array.isArray(json.products) || json.products.length === 0) return null;
    console.log(`🌐 Live enrichment: fetched ${json.products.length} DummyJSON groceries`);
    return json.products.map((p, i) => ({
      name: String(p.title),
      sku: `DJ-${p.id ?? i}`,
      categoryName: 'Pantry Staples',
      brandName: String(p.brand ?? 'Generic'),
      description: String(p.description ?? ''),
      price: Number(p.price ?? 1),
      discountPercentage: Number(p.discountPercentage ?? 0),
      unit: 'piece',
      images: (Array.isArray(p.images) ? (p.images as string[]) : []).map((url, k) => ({
        url,
        alt: String(p.title),
        isPrimary: k === 0,
      })),
      thumbnail: String(p.thumbnail ?? ''),
      stock: Number(p.stock ?? 50),
      lowStockThreshold: 10,
      tags: ['groceries'],
      rating: Number(p.rating ?? 4.2),
      reviewCount: 10,
      soldCount: 100,
    }));
  } catch {
    return null;
  }
}

function loadBundled(): SeedData {
  const file = path.resolve(__dirname, 'data.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as SeedData;
}

async function seed(): Promise<void> {
  await connectDatabase();
  console.log('🌱 Seeding database...');

  const bundled = loadBundled();
  const live = await tryFetchLiveGroceries();
  const products = live ? [...bundled.products, ...live] : bundled.products;

  // Reset collections (idempotent seed)
  await Promise.all([
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  // Categories
  const categoryDocs = await Category.insertMany(
    bundled.categories.map((c, i) => ({
      name: c.name,
      slug: slugify(c.name, { lower: true, strict: true }),
      description: c.description,
      icon: c.icon,
      isFeatured: c.isFeatured ?? false,
      sortOrder: i,
    })),
  );
  const categoryMap = new Map(categoryDocs.map((c) => [c.name, c._id]));
  console.log(`✅ ${categoryDocs.length} categories`);

  // Brands
  const brandNames = new Set<string>(bundled.brands.map((b) => b.name));
  for (const p of products) brandNames.add(p.brandName);
  const brandDocs = await Brand.insertMany(
    [...brandNames].map((name, i) => ({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      isFeatured: i < 10,
    })),
  );
  const brandMap = new Map(brandDocs.map((b) => [b.name, b._id]));
  console.log(`✅ ${brandDocs.length} brands`);

  // Products
  const fallbackCategoryId = categoryDocs[0]._id;
  const productPayload = products.map((p) => ({
    name: p.name,
    slug: `${slugify(p.name, { lower: true, strict: true })}-${p.sku.toLowerCase()}`,
    sku: p.sku.toUpperCase(),
    barcode: p.barcode,
    description: p.description,
    shortDescription: p.shortDescription,
    category: categoryMap.get(p.categoryName) ?? fallbackCategoryId,
    brand: brandMap.get(p.brandName),
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    discountPercentage: p.discountPercentage,
    unit: p.unit,
    weight: p.weight,
    images: p.images,
    thumbnail: p.thumbnail ?? p.images?.[0]?.url,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold ?? 10,
    tags: p.tags,
    nutrition: p.nutrition,
    rating: p.rating,
    reviewCount: p.reviewCount,
    soldCount: p.soldCount,
    isFeatured: p.isFeatured ?? false,
    isBestSeller: p.isBestSeller ?? false,
    isOnDeal: p.isOnDeal ?? p.discountPercentage > 0,
    isFlashSale: p.isFlashSale ?? false,
    flashSaleEndsAt: p.isFlashSale ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : undefined,
    meta: { title: p.name, description: p.shortDescription, keywords: p.tags },
  }));
  await Product.insertMany(productPayload, { ordered: false });
  console.log(`✅ ${productPayload.length} products`);

  // Users: admin, manager, customer
  await User.deleteMany({ email: { $in: [env.SEED_ADMIN_EMAIL, 'manager@supermarket.local', 'customer@supermarket.local'] } });
  await User.create([
    {
      firstName: 'Site',
      lastName: 'Admin',
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      role: ROLES.ADMIN,
      isEmailVerified: true,
    },
    {
      firstName: 'Store',
      lastName: 'Manager',
      email: 'manager@supermarket.local',
      password: 'Manager@12345',
      role: ROLES.MANAGER,
      isEmailVerified: true,
    },
    {
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'customer@supermarket.local',
      password: 'Customer@12345',
      role: ROLES.CUSTOMER,
      isEmailVerified: true,
    },
  ]);
  console.log('✅ 3 users (admin / manager / customer)');

  // Coupons
  await Coupon.insertMany([
    {
      code: 'WELCOME10',
      description: '10% off your first order',
      discountType: DISCOUNT_TYPE.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 20,
      maxDiscountAmount: 15,
      usageLimit: 1000,
      perUserLimit: 1,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'FRESH5',
      description: '$5 off orders over $30',
      discountType: DISCOUNT_TYPE.FIXED,
      discountValue: 5,
      minOrderAmount: 30,
      usageLimit: 500,
      perUserLimit: 3,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log('✅ 2 coupons (WELCOME10, FRESH5)');

  console.log('\n🎉 Seed complete!');
  console.log('   Admin:    ', env.SEED_ADMIN_EMAIL, '/', env.SEED_ADMIN_PASSWORD);
  console.log('   Manager:   manager@supermarket.local / Manager@12345');
  console.log('   Customer:  customer@supermarket.local / Customer@12345');

  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
