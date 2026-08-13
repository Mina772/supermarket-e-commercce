'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const perks = [
  { icon: Truck, title: 'Free delivery', desc: 'On orders over $50' },
  { icon: Clock, title: 'Same-day delivery', desc: 'Order before 2pm' },
  { icon: ShieldCheck, title: 'Fresh guarantee', desc: '100% quality promise' },
];

export function Hero(): JSX.Element {
  return (
    <section className="container pt-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-emerald-600 px-6 py-16 text-primary-foreground sm:px-12 sm:py-24">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-black/10 blur-2xl" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative max-w-2xl"
        >
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            🥑 Fresh groceries, delivered daily
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Your premium supermarket, now online.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/90">
            Thousands of fresh products, exclusive deals and lightning-fast delivery — everything you need under one roof.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link href="/products">
                Shop now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/deals">Today&apos;s deals</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {perks.map((p) => (
          <div key={p.title} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <p.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
