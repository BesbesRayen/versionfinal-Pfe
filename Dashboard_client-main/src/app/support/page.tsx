'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import FAQAccordion from '@/components/FAQAccordion';
import { faqs, faqCategories } from '@/data/faq';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const supportCategories = [
  {
    icon: HelpCircle,
    title: "Centre d'aide",
    description: 'Trouvez des reponses rapides aux questions les plus frequentes.',
    color: 'bg-indigo-500/10 text-indigo-300',
  },
  {
    icon: Headphones,
    title: 'Assistance technique',
    description: 'Un probleme technique ? Notre equipe est la pour vous aider.',
    color: 'bg-violet-500/10 text-violet-300',
  },
  {
    icon: AlertTriangle,
    title: 'Reclamations',
    description: 'Soumettez une reclamation et suivez son traitement.',
    color: 'bg-amber-500/10 text-amber-300',
  },
  {
    icon: MessageSquare,
    title: 'Chat en direct',
    description: 'Discutez en temps reel avec un conseiller CreditTN.',
    color: 'bg-cyan-500/10 text-cyan-300',
  },
];

function messageStatus(status: string) {
  if (status === 'unread' || status === 'new') {
    return { label: 'Nouveau', className: 'bg-indigo-500/10 text-indigo-300' };
  }
  if (status === 'read') {
    return { label: 'Lu', className: 'bg-blue-500/10 text-blue-300' };
  }
  return { label: 'Repondu', className: 'bg-emerald-500/10 text-emerald-300' };
}

export default function SupportPage() {
  const [selectedFAQCategory, setSelectedFAQCategory] = useState(faqCategories[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages || []);
          setMessagesError('');
        } else {
          setMessages([]);
        }
      } catch {
        setMessagesError('Impossible de charger les messages');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const filteredFAQs = faqs.filter((faq) => faq.category === selectedFAQCategory);

  return (
    <div className="bg-[#070b14] pt-20 text-white">
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#070b14_0%,#0d1424_52%,#11172a_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(129, 140, 248, 0.42) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="container-custom relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2">
              <Headphones className="h-4 w-4 text-indigo-300" />
              <span className="text-sm font-medium text-indigo-200">Service client</span>
            </div>
            <h1 className="mb-6 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Comment pouvons-nous <span className="gradient-text">vous aider ?</span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              Notre equipe de support est disponible pour repondre a vos questions et resoudre vos
              problemes rapidement.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding !pt-0">
        <div className="container-custom mx-auto">
          <div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {supportCategories.map((cat) => (
              <div
                key={cat.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/30 hover:bg-white/[0.07]"
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${cat.color} transition-transform duration-300 group-hover:scale-105`}
                >
                  <cat.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-white">{cat.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{cat.description}</p>
              </div>
            ))}
          </div>

          <div className="mb-20">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
                Questions frequentes
              </h2>
              <p className="text-lg text-slate-400">
                Retrouvez les reponses aux questions les plus posees par nos utilisateurs.
              </p>
            </div>

            <div className="mb-10 flex flex-wrap justify-center gap-2">
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFAQCategory(cat)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    selectedFAQCategory === cat
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mx-auto max-w-3xl">
              <FAQAccordion faqs={filteredFAQs} />
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 font-display text-3xl font-bold text-white">Contactez-nous</h2>
                <p className="text-lg leading-relaxed text-slate-400">
                  Vous ne trouvez pas la reponse a votre question ? Contactez notre equipe support.
                </p>
              </div>

              <div className="space-y-6">
                <ContactInfo
                  icon={Mail}
                  title="Email"
                  value="support@credittn.tn"
                  href="mailto:support@credittn.tn"
                  meta="Reponse sous 24h"
                />
                <ContactInfo
                  icon={Phone}
                  title="Telephone"
                  value="+216 71 000 000"
                  href="tel:+21671000000"
                  meta="Lun - Ven, 8h - 18h"
                />
                <ContactInfo
                  icon={MapPin}
                  title="Adresse"
                  value="Rue du Lac Biwa, Les Berges du Lac"
                  meta="1053 Tunis, Tunisie"
                />
                <ContactInfo
                  icon={Clock}
                  title="Horaires"
                  value="Lundi - Vendredi : 8h00 - 18h00"
                  meta="Samedi : 9h00 - 13h00"
                />
              </div>
            </div>

            <div className="glass-card glow p-8">
              <h3 className="mb-6 font-display text-xl font-bold text-white">
                Envoyez-nous un message
              </h3>
              <ContactForm />
            </div>
          </div>

          <div className="mt-20 border-t border-white/10 pt-20">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
                Messages recus
              </h2>
              <p className="text-lg text-slate-400">
                Consultez tous les messages soumis via le formulaire de contact.
              </p>
            </div>

            {messagesLoading ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-bounce rounded-full bg-indigo-500" />
                  <div className="h-4 w-4 animate-bounce rounded-full bg-indigo-500 delay-100" />
                  <div className="h-4 w-4 animate-bounce rounded-full bg-indigo-500 delay-200" />
                </div>
                <p className="mt-4 text-slate-400">Chargement des messages...</p>
              </div>
            ) : messagesError ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                <p className="text-red-100">{messagesError}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-6 text-center">
                <p className="text-indigo-100">Aucun message pour le moment.</p>
              </div>
            ) : (
              <div className="mx-auto grid max-w-4xl gap-6">
                {messages.map((msg) => {
                  const status = messageStatus(msg.status);
                  return (
                    <div
                      key={msg.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-indigo-300/30 hover:bg-white/[0.06]"
                    >
                      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="break-words font-display text-lg font-bold text-white">
                            {msg.subject}
                          </h4>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                            <span>
                              <span className="font-medium text-slate-300">De:</span> {msg.name}
                            </span>
                            <span>
                              <span className="font-medium text-slate-300">Email:</span>{' '}
                              <a href={`mailto:${msg.email}`} className="text-indigo-300 hover:underline">
                                {msg.email}
                              </a>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                          <p className="text-xs text-slate-500">
                            {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-300">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactInfo({
  icon: Icon,
  title,
  value,
  meta,
  href,
}: {
  icon: typeof Mail;
  title: string;
  value: string;
  meta: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
        <Icon className="h-5 w-5 text-indigo-300" />
      </div>
      <div>
        <h4 className="mb-1 font-semibold text-white">{title}</h4>
        {href ? (
          <a href={href} className="text-indigo-300 transition-colors hover:text-indigo-200">
            {value}
          </a>
        ) : (
          <p className="text-slate-300">{value}</p>
        )}
        <p className="mt-1 text-sm text-slate-500">{meta}</p>
      </div>
    </div>
  );
}
