export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export const faqCategories = [
  'General',
  'Paiement',
  'Compte',
  'Boutiques',
  'Securite',
];

export const faqs: FAQ[] = [
  {
    id: 1,
    question: "Qu'est-ce que CreditTN ?",
    answer:
      "CreditTN est une plateforme tunisienne de paiement echelonne (Buy Now, Pay Later). Elle vous permet d'acheter des produits dans nos boutiques partenaires et de payer en plusieurs mensualites sans frais caches.",
    category: 'General',
  },
  {
    id: 2,
    question: 'Comment fonctionne le paiement echelonne ?',
    answer:
      "Choisissez vos articles dans une boutique partenaire, selectionnez CreditTN comme mode de paiement, et divisez le montant en 3, 6 ou 12 mensualites. Le premier versement est effectue a l'achat, les suivants sont preleves automatiquement.",
    category: 'Paiement',
  },
  {
    id: 3,
    question: 'Comment creer un compte CreditTN ?',
    answer:
      "Telechargez l'application CreditTN ou inscrivez-vous sur notre site web. Renseignez vos informations personnelles, verifiez votre email et votre numero de telephone. Votre compte sera active apres verification de votre identite.",
    category: 'Compte',
  },
  {
    id: 4,
    question: 'Quelles sont les boutiques partenaires ?',
    answer:
      "CreditTN collabore avec plus de 100 boutiques partenaires en Tunisie couvrant l'electronique, la mode, l'electromenager, le sport et plus encore. Consultez notre page Boutiques pour la liste complete.",
    category: 'Boutiques',
  },
  {
    id: 5,
    question: 'Mes donnees sont-elles securisees ?',
    answer:
      "CreditTN utilise un chiffrement SSL de bout en bout, l'authentification a deux facteurs et des controles de securite stricts pour proteger vos donnees bancaires et personnelles.",
    category: 'Securite',
  },
  {
    id: 6,
    question: 'Y a-t-il des frais ou interets ?',
    answer:
      'CreditTN propose des plans de paiement sans interets pour les echeanciers de 3 mois. Pour les plans de 6 et 12 mois, les frais de service sont clairement affiches avant validation.',
    category: 'Paiement',
  },
  {
    id: 7,
    question: 'Que se passe-t-il en cas de retard de paiement ?',
    answer:
      "En cas de retard, vous recevez une notification de rappel. Apres 7 jours de retard, des penalites peuvent s'appliquer. Contactez le support rapidement pour trouver une solution adaptee.",
    category: 'Paiement',
  },
  {
    id: 8,
    question: 'Comment devenir une boutique partenaire ?',
    answer:
      "Si vous etes commercant en Tunisie et souhaitez proposer le paiement CreditTN a vos clients, contactez-nous via le formulaire de partenariat ou a l'adresse partenaires@credittn.tn.",
    category: 'Boutiques',
  },
  {
    id: 9,
    question: "Puis-je modifier ou annuler un plan d'echelonnement ?",
    answer:
      "Les modifications sont possibles dans les 24h suivant la transaction. L'annulation complete depend de la politique de retour de la boutique partenaire. Contactez notre support pour toute demande specifique.",
    category: 'Paiement',
  },
  {
    id: 10,
    question: 'Comment reinitialiser mon mot de passe ?',
    answer:
      "Cliquez sur 'Mot de passe oublie' sur la page de connexion. Un lien de reinitialisation sera envoye a votre adresse email. Le lien est valable pendant 24 heures.",
    category: 'Compte',
  },
];
