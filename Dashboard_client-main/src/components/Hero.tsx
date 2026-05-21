'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CreditCard,
  Dumbbell,
  Laptop,
  LucideIcon,
  Play,
  Shield,
  Shirt,
  Store,
  TrendingUp,
  Zap,
} from 'lucide-react';

function scrollToDemo() {
  const el = document.getElementById('how-it-works') ?? document.getElementById('features');
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-[#070b14]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#070b14_0%,#0d1424_48%,#11172a_100%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-slate-950/80 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.08),transparent_28%,rgba(34,211,238,0.05)_72%,transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(129, 140, 248, 0.46) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />
      </div>

      <div className="container-custom relative z-10 mx-auto px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-slide-up space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 shadow-lg shadow-indigo-950/20">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-sm font-bold text-indigo-200">
                Nouveau en Tunisie - Paiement echelonne
              </span>
            </div>

            <h1 className="max-w-3xl text-balance font-display text-4xl font-black leading-[1.04] text-white sm:text-5xl lg:text-6xl">
              Achetez maintenant,{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
                payez plus tard
              </span>{' '}
              en toute simplicite
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              CreditTN vous permet de diviser vos achats en{' '}
              <strong className="font-black text-white">3, 6 ou 12 mensualites</strong>{' '}
              dans vos boutiques preferees en Tunisie. Sans surprises, sans stress.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-indigo-950/40 transition hover:bg-indigo-500 active:scale-95"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-8 py-4 text-base font-black text-white shadow-lg shadow-black/20 transition hover:border-indigo-300/40 hover:bg-white/[0.09] active:scale-95"
              >
                <Play className="h-5 w-5 text-indigo-200" />
                Voir la demo
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <TrustItem icon={Shield} label="100% securise" color="text-emerald-300" />
              <TrustItem icon={Zap} label="Approbation rapide" color="text-amber-300" />
              <TrustItem icon={TrendingUp} label="0% interet" color="text-cyan-300" />
            </div>
          </div>

          <div className="animate-fade-in relative flex justify-center lg:justify-end">
            <div className="relative">
              <div className="h-[34rem] w-[17rem] animate-float rounded-[2.8rem] bg-black p-3 shadow-2xl shadow-black/50 sm:h-[36rem] sm:w-72">
                <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-[#3578ff] via-[#2458e7] to-[#1737b5] text-white">
                  <div className="absolute left-1/2 top-0 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-black" />

                  <div className="space-y-6 p-6 pt-12">
                    <div className="space-y-2 pt-4 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.18] shadow-lg shadow-blue-950/20">
                        <CreditCard className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-black">CreditTN</h3>
                      <p className="text-xs font-semibold text-blue-100">Votre solde disponible</p>
                    </div>

                    <div className="text-center">
                      <p className="text-4xl font-black tracking-tight">2 500</p>
                      <p className="text-sm font-semibold text-blue-100">TND</p>
                    </div>

                    <div className="space-y-3">
                      <PhoneLine icon={Laptop} title="TechnoStore" meta="3x sans frais" amount="-450 TND" />
                      <PhoneLine icon={Shirt} title="ModaChic" meta="6x mensualites" amount="-280 TND" />
                      <PhoneLine icon={Dumbbell} title="FitnessPro" meta="3x sans frais" amount="-180 TND" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-slide-in-left absolute -left-5 top-24 rounded-2xl border border-white/10 bg-slate-900/88 p-4 shadow-xl shadow-black/30 backdrop-blur-xl sm:-left-20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15">
                    <Check className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Approuve !</p>
                    <p className="text-xs font-semibold text-slate-400">3x 150 TND/mois</p>
                  </div>
                </div>
              </div>

              <div className="animate-slide-in-right absolute -right-4 bottom-32 rounded-2xl border border-white/10 bg-slate-900/88 p-4 shadow-xl shadow-black/30 backdrop-blur-xl sm:-right-12">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/15">
                    <Store className="h-5 w-5 text-indigo-200" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">+100 Boutiques</p>
                    <p className="text-xs font-semibold text-slate-400">Partenaires actifs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  label,
  color,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 shadow-sm shadow-black/10">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className="text-sm font-bold text-slate-300">{label}</span>
    </div>
  );
}

function PhoneLine({
  icon: Icon,
  title,
  meta,
  amount,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  amount: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.14] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.16]">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{title}</p>
            <p className="text-xs font-semibold text-blue-100">{meta}</p>
          </div>
        </div>
        <p className="whitespace-nowrap text-sm font-black">{amount}</p>
      </div>
    </div>
  );
}
