import { Clock, Shield, Smartphone, TrendingDown, Users, Wallet } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Paiement echelonne',
    description:
      'Divisez vos achats en 3, 6 ou 12 mensualites confortables. Gardez votre budget lisible sans stress.',
    color: 'bg-indigo-500/10 text-indigo-300',
  },
  {
    icon: Shield,
    title: 'Securite maximale',
    description:
      'Chiffrement, controle des sessions et protection des donnees sensibles pour des paiements plus sereins.',
    color: 'bg-emerald-500/10 text-emerald-300',
  },
  {
    icon: Clock,
    title: 'Approbation instantanee',
    description:
      "Obtenez une reponse en quelques secondes, sans paperasse ni delais d'attente inutiles.",
    color: 'bg-amber-500/10 text-amber-300',
  },
  {
    icon: TrendingDown,
    title: '0% interet sur 3 mois',
    description:
      'Profitez du paiement en 3 fois sans frais supplementaire. Les conditions restent claires avant validation.',
    color: 'bg-cyan-500/10 text-cyan-300',
  },
  {
    icon: Smartphone,
    title: 'Application mobile',
    description:
      'Gerez vos paiements, consultez votre historique et trouvez des boutiques depuis votre telephone.',
    color: 'bg-violet-500/10 text-violet-300',
  },
  {
    icon: Users,
    title: '+100 boutiques partenaires',
    description:
      'Un reseau grandissant dans toute la Tunisie : electronique, mode, sport et plus encore.',
    color: 'bg-rose-500/10 text-rose-300',
  },
];

export default function Features() {
  return (
    <section className="section-padding relative bg-[#0b1120]" id="features">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.34) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="container-custom relative z-10 mx-auto">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2">
            <span className="text-sm font-medium text-indigo-200">Pourquoi CreditTN</span>
          </div>
          <h2 className="mb-6 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Tout ce dont vous avez besoin pour{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
              acheter en liberte
            </span>
          </h2>
          <p className="text-lg leading-relaxed text-slate-400">
            CreditTN combine technologie de paiement, controles de credit et simplicite pour une
            experience fluide en Tunisie.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/30 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-black/20"
            >
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform duration-300 group-hover:scale-105`}
              >
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-white">{feature.title}</h3>
              <p className="leading-relaxed text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
