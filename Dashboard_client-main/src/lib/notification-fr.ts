const TITLE_TRANSLATIONS: Record<string, string> = {
  'Payment reminder': 'Rappel de paiement',
  'Payment method added': 'Moyen de paiement ajouté',
  'Payment method replaced': 'Moyen de paiement remplacé',
  'Payment method removed': 'Moyen de paiement supprimé',
  'Autopay Failed': 'Échec du paiement automatique',
  'Autopay Successful': 'Paiement automatique réussi',
  'Installment Overdue': 'Échéance en retard',
  'Credit Approved': 'Crédit approuvé',
  'Credit Rejected': 'Crédit refusé',
  'Financial profile updated': 'Profil financier mis à jour',
  'KYC verified': 'Identité vérifiée',
  'KYC Rejected': 'Vérification d’identité refusée',
  'KYC Manual Review': 'Vérification manuelle de l’identité',
  'Payment Confirmed': 'Paiement confirmé',
  'All Installments Paid': 'Toutes les échéances sont payées',
  'Purchase confirmed': 'Achat confirmé',
  'Credit purchase confirmed': 'Achat à crédit confirmé',
  'New credit purchase': 'Nouvel achat à crédit',
  'Invoice generated': 'Facture générée',
};

const MESSAGE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/^Your card (.+) has been linked successfully\.$/, 'Votre carte se terminant par $1 a été ajoutée avec succès.'],
  [/^Your default payment card has been updated\.$/, 'Votre carte de paiement par défaut a été mise à jour.'],
  [/^Your card ending in (.+) has been removed\.$/, 'Votre carte se terminant par $1 a été supprimée.'],
  [/^Add an active default payment card to auto-pay installment due on (.+)$/, 'Ajoutez une carte active par défaut pour payer automatiquement l’échéance du $1.'],
  [/^Insufficient wallet balance for installment due on (.+)\. Required: (.+) TND$/, 'Solde insuffisant pour l’échéance du $1. Montant requis : $2 TND.'],
  [/^Auto-payment of (.+) TND processed for installment due (.+)\. Ref: (.+)$/, 'Paiement automatique de $1 TND effectué pour l’échéance du $2. Réf. : $3.'],
  [/^Your installment of (.+) DT due on (.+) is overdue\. A 5% penalty has been applied\.$/, 'Votre échéance de $1 DT prévue le $2 est en retard. Une pénalité de 5 % a été appliquée.'],
  [/^Your credit request of (.+) DT has been approved\.$/, 'Votre demande de crédit de $1 DT a été approuvée.'],
  [/^Your credit request has been approved\.$/, 'Votre demande de crédit a été approuvée.'],
  [/^Your credit request has been rejected\.$/, 'Votre demande de crédit a été refusée.'],
  [/^Your salary profile is now complete\. You can request credit\.$/, 'Votre profil financier est complet. Vous pouvez demander un crédit.'],
  [/^Your identity has been verified successfully\.$/, 'Votre identité a été vérifiée avec succès.'],
  [/^Your identity verification was rejected\. Reason: (.+)$/, 'La vérification de votre identité a été refusée. Motif : $1.'],
  [/^Your identity verification needs manual review\. Reason: (.+)$/, 'La vérification de votre identité nécessite un contrôle manuel. Motif : $1.'],
  [/^Payment of (.+) DT confirmed\. Receipt: (.+)$/, 'Paiement de $1 DT confirmé. Reçu : $2.'],
  [/^All your due installments have been paid successfully\.$/, 'Toutes vos échéances ont été payées avec succès.'],
  [/^All installments for this purchase have been paid successfully\.$/, 'Toutes les échéances de cet achat ont été payées avec succès.'],
  [/^Outstanding installments collected by admin$/, 'Les échéances impayées ont été encaissées par l’administrateur.'],
  [/^Cash purchase confirmed for (.+)\. Ref: (.+)$/, 'Achat au comptant confirmé pour $1. Réf. : $2.'],
  [/^Your order for (.+) is active on (\d+) installments\.$/, 'Votre commande de $1 est active avec $2 échéances.'],
  [/^Reminder: installment for (.+) is due tomorrow \((.+)\), amount (.+) TND\.$/, 'Rappel : l’échéance de $1 est prévue demain ($2), pour un montant de $3 TND.'],
  [/^Reminder: installment for (.+) is due in 2 days \((.+)\), amount (.+) TND\.$/, 'Rappel : l’échéance de $1 est prévue dans 2 jours ($2), pour un montant de $3 TND.'],
  [/^Client (.+) purchased (.+) on credit\. Transaction: (.+), installments: (\d+)\.$/, 'Le client $1 a acheté $2 à crédit. Transaction : $3, échéances : $4.'],
  [/^Invoice (.+) generated for transaction (.+)$/, 'La facture $1 a été générée pour la transaction $2.'],
];

export const translateNotificationTitle = (title: string) => TITLE_TRANSLATIONS[title] ?? title;

export const translateNotificationMessage = (message: string) => {
  for (const [pattern, translation] of MESSAGE_TRANSLATIONS) {
    if (pattern.test(message)) return message.replace(pattern, translation);
  }
  return message;
};
