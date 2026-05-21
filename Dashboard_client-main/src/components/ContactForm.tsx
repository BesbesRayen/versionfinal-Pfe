'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';

const initialFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function ContactForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi du message");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur du serveur');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
          <CheckCircle className="h-8 w-8 text-indigo-300" />
        </div>
        <h3 className="font-display text-xl font-bold text-white">Message envoye avec succes !</h3>
        <p className="text-gray-400">Notre equipe vous repondra dans les plus brefs delais.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData(initialFormData);
          }}
          className="btn-secondary mt-4 text-sm"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
          <p className="text-sm text-red-100">{error}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field-dark"
            placeholder="Votre nom"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-field-dark"
            placeholder="votre@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-300">
          Sujet
        </label>
        <select
          id="subject"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="input-field-dark"
        >
          <option value="">Selectionnez un sujet</option>
          <option value="general">Question generale</option>
          <option value="payment">Probleme de paiement</option>
          <option value="account">Mon compte</option>
          <option value="partner">Devenir partenaire</option>
          <option value="complaint">Reclamation</option>
          <option value="technical">Assistance technique</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-300">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="input-field-dark resize-none"
          placeholder="Decrivez votre demande..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full gap-2 text-base !py-4 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Envoyer le message
          </>
        )}
      </button>
    </form>
  );
}
