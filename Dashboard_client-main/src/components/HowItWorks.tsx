import { CalendarCheck, CreditCard, Search, ShoppingBag } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Choisissez votre boutique',
    description: 'Parcourez le reseau de boutiques partenaires et trouvez ce dont vous avez besoin.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    number: '02',
    icon: ShoppingBag,
    title: 'Faites vos achats',
    description: 'Selectionnez vos articles et choisissez CreditTN comme mode de paiement.',
    color: 'from-violet-500 to-violet-600',
  },
  {
    number: '03',
    icon: CalendarCheck,
    title: 'Choisissez vos mensualites',
    description: 'Divisez le montant en 3, 6 ou 12 mensualites avec une decision rapide.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    number: '04',
    icon: CreditCard,
    title: 'Payez sereinement',
    description: "Les echeances sont suivies dans l'application avec des rappels clairs.",
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding relative overflow-hidden bg-[#070b14]" id="how-it-works">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#070b14_0%,#0d1424_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(129, 140, 248, 0.38) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      <div className="container-custom relative z-10 mx-auto">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
            <span className="text-sm font-medium text-slate-300">Comment ca marche</span>
          </div>
          <h2 className="mb-6 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Simple comme{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
              1, 2, 3, 4
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            En quelques etapes, commencez a profiter du paiement echelonne CreditTN.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="group relative">
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-14 hidden h-[2px] w-[calc(100%-40px)] bg-gradient-to-r from-white/10 to-transparent lg:block" />
              )}

              <div className="space-y-4 text-center">
                <div className="relative inline-flex">
                  <div
                    className={`flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br ${step.color} shadow-lg shadow-black/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
                  >
                    <step.icon className="h-12 w-12 text-white" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-sm font-bold text-white shadow-md">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white">{step.title}</h3>
                <p className="leading-relaxed text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
