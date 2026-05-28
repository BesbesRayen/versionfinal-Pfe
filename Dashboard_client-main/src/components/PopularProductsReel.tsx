'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import MobileAccessModal from '@/components/MobileAccessModal';

interface PopularProduct {
  id: number;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082';

const CATEGORY_MARK: Record<string, string> = {
  'Informatique & Electronique': 'IT',
  'Grande Distribution': 'GD',
  'Mode & Beaute': 'MB',
  Electromenager: 'EL',
  'Meubles & Decoration': 'MD',
  'Sport & Loisirs': 'SL',
};

export default function PopularProductsReel() {
  const [products, setProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileModal, setMobileModal] = useState<{ open: boolean; link: string; name: string }>({
    open: false,
    link: '',
    name: '',
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/articles/popular?limit=12`)
      .then((r) => r.json())
      .then((data: PopularProduct[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const openMobileAccess = (product: PopularProduct) => {
    const params = new URLSearchParams({
      articleId: String(product.id),
      shopName: product.boutiqueName,
    });
    const link = `creditn://product?${params.toString()}`;
    setMobileModal({ open: true, link, name: product.productName });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="section-padding bg-slate-950" id="popular-products">
      <div className="container-custom mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-400/10 rounded-2xl flex items-center justify-center border border-cyan-300/20">
              <TrendingUp className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Produits <span className="text-cyan-300">populaires</span>
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Payez en plusieurs fois avec CreditTN</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-cyan-300/40 transition-colors"
              aria-label="Defiler a gauche"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-cyan-300/40 transition-colors"
              aria-label="Defiler a droite"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-52 h-72 bg-white/5 rounded-2xl animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <ProductReelCard
                key={product.id}
                product={product}
                onBuy={() => openMobileAccess(product)}
              />
            ))}
          </div>
        )}
      </div>

      <MobileAccessModal
        isOpen={mobileModal.open}
        onClose={() => setMobileModal((s) => ({ ...s, open: false }))}
        deepLink={mobileModal.link}
        title={mobileModal.name}
      />
    </section>
  );
}

function ProductReelCard({
  product,
  onBuy,
}: {
  product: PopularProduct;
  onBuy: () => void;
}) {
  const categoryMark = CATEGORY_MARK[product.category] ?? 'PR';
  const imageUrl = product.imageUrl?.startsWith('/') ? `${API_BASE}${product.imageUrl}` : product.imageUrl;
  const hasImage = Boolean(imageUrl);

  return (
    <div className="group shrink-0 w-52 snap-start flex flex-col bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-300/40 hover:shadow-xl hover:shadow-cyan-950/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="relative h-40 bg-slate-950 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl || ''}
            alt={product.productName}
            fill
            sizes="208px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <span className="text-sm font-black tracking-wide text-cyan-200 bg-cyan-300/10 border border-cyan-300/20 rounded-xl px-3 py-2 group-hover:scale-110 transition-transform duration-300">
            {categoryMark}
          </span>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full max-w-[80%] truncate">
          {product.boutiqueName}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 flex-1">
          {product.productName}
        </h3>
        <div>
          <p className="text-lg font-bold text-cyan-300">
            {product.price.toLocaleString('fr-TN')} TND
          </p>
          <p className="text-xs text-gray-500">
            Env. {Math.round(product.price / 3).toLocaleString('fr-TN')} TND x 3
          </p>
        </div>
        <button
          onClick={onBuy}
          className="mt-1 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-colors"
        >
          Acheter maintenant
        </button>
      </div>
    </div>
  );
}
