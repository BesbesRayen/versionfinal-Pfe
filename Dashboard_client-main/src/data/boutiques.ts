export type BoutiqueCategory = 'Informatique' | 'Beaute' | 'International';

export interface Product {
  name: string;
  price: string;
  tag: string;
}

export interface Boutique {
  id: number;
  name: string;
  logo: string;
  category: BoutiqueCategory;
  categoryLabel: string;
  city: string;
  country: string;
  isLocal: boolean;
  conventionActive?: boolean;
  checkoutLabel: 'CreditTN checkout' | "Acheter dans l'app";
  description: string;
  longDescription: string;
  website: string;
  accent: string;
  founded: string;
  locations: number;
  products: Product[];
}

export const categories = ['Toutes', 'Informatique', 'Beaute', 'International', 'Favoris'] as const;

export const boutiques: Boutique[] = [
  {
    id: 9,
    name: 'Tunisianet',
    logo: 'TN',
    category: 'Informatique',
    categoryLabel: 'Informatique & electronique',
    city: 'Ariana',
    country: 'Tunisie',
    isLocal: true,
    checkoutLabel: 'CreditTN checkout',
    description: 'Marketplace informatique, telephonie et accessoires high-tech.',
    longDescription:
      'Tunisianet est une reference e-commerce en Tunisie pour le materiel informatique, les smartphones, les accessoires et les produits high-tech. Avec CreditTN, les achats deviennent plus accessibles grace au paiement flexible.',
    website: 'https://www.tunisianet.com.tn',
    accent: '#22D3EE',
    founded: '2008',
    locations: 3,
    products: [
      { name: 'Samsung Galaxy S24 Ultra', price: '4599 TND', tag: 'Smartphone' },
      { name: 'Imprimante HP LaserJet Pro', price: '650 TND', tag: 'Bureau' },
      { name: 'Laptop Asus Vivobook', price: '2199 TND', tag: 'Laptop' },
    ],
  },
  {
    id: 2,
    name: 'Mytek',
    logo: 'MY',
    category: 'Informatique',
    categoryLabel: 'Informatique & electronique',
    city: 'Tunis',
    country: 'Tunisie',
    isLocal: true,
    checkoutLabel: 'CreditTN checkout',
    description: 'Leader high-tech tunisien pour laptops, smartphones et gaming.',
    longDescription:
      'Mytek propose un catalogue large de produits informatiques, smartphones, electromenager et gaming. La page CreditTN met en avant les achats compatibles avec une experience simple et premium.',
    website: 'https://www.mytek.tn',
    accent: '#6D5DFB',
    founded: '2010',
    locations: 15,
    products: [
      { name: 'Laptop HP Pavilion 15', price: '2499 TND', tag: 'Laptop' },
      { name: 'iPhone 15 Pro 128Go', price: '4299 TND', tag: 'Mobile' },
      { name: 'Casque gaming sans fil', price: '349 TND', tag: 'Gaming' },
    ],
  },
  {
    id: 15,
    name: 'Scoop Informatique',
    logo: 'SC',
    category: 'Informatique',
    categoryLabel: 'Informatique & electronique',
    city: 'Sousse',
    country: 'Tunisie',
    isLocal: true,
    checkoutLabel: 'CreditTN checkout',
    description: 'Informatique, bureautique et accessoires en ligne.',
    longDescription:
      'Scoop Informatique accompagne les particuliers et professionnels avec du materiel informatique, bureautique et accessoires, dans une logique de prix competitifs et livraison rapide.',
    website: 'https://www.scoop.com.tn',
    accent: '#F59E0B',
    founded: '2011',
    locations: 2,
    products: [
      { name: 'Pack bureau complet', price: '2800 TND', tag: 'Bureau' },
      { name: "Cartouches d'encre multipack", price: '120 TND', tag: 'Accessoires' },
      { name: 'Ecran 24 pouces Full HD', price: '420 TND', tag: 'Display' },
    ],
  },
  {
    id: 18,
    name: 'Spacenet',
    logo: 'SP',
    category: 'Informatique',
    categoryLabel: 'Informatique & electronique',
    city: 'Tunis',
    country: 'Tunisie',
    isLocal: true,
    checkoutLabel: 'CreditTN checkout',
    description: 'Vente en ligne high-tech, composants et materiel informatique.',
    longDescription:
      'Spacenet est une destination high-tech tunisienne pour ordinateurs, composants, reseaux, accessoires et solutions professionnelles, avec un parcours d achat compatible CreditTN.',
    website: 'https://www.spacenet.tn',
    accent: '#19C37D',
    founded: '2004',
    locations: 6,
    products: [
      { name: 'Routeur Wi-Fi 6', price: '289 TND', tag: 'Reseau' },
      { name: 'SSD NVMe 1To', price: '329 TND', tag: 'Composant' },
      { name: 'Laptop professionnel Dell', price: '2990 TND', tag: 'Pro' },
    ],
  },
  {
    id: 3,
    name: 'Mega PC',
    logo: 'MP',
    category: 'Informatique',
    categoryLabel: 'Informatique & electronique',
    city: 'Tunis',
    country: 'Tunisie',
    isLocal: true,
    checkoutLabel: 'CreditTN checkout',
    description: 'Specialiste PC gaming, composants et setups performants.',
    longDescription:
      'Mega PC se concentre sur les configurations gaming, les composants et les peripheriques. CreditTN permet de lisser les achats importants avec des mensualites transparentes.',
    website: 'https://www.megapc.tn',
    accent: '#8B5CF6',
    founded: '2005',
    locations: 5,
    products: [
      { name: 'PC Gamer RTX 4060', price: '3200 TND', tag: 'Gaming' },
      { name: 'Ecran 27 pouces 144Hz', price: '890 TND', tag: 'Display' },
      { name: 'Clavier mecanique RGB', price: '210 TND', tag: 'Accessoires' },
    ],
  },
  {
    id: 4,
    name: 'Fatales',
    logo: 'FA',
    category: 'Beaute',
    categoryLabel: 'Mode / beaute',
    city: 'Tunis',
    country: 'Tunisie',
    isLocal: true,
    checkoutLabel: 'CreditTN checkout',
    description: 'Parfums, cosmetiques et produits beaute premium.',
    longDescription:
      'Fatales propose une selection de parfums, soins et cosmetiques premium. L experience CreditTN garde le parcours clair, elegant et adapte aux achats beaute.',
    website: 'https://www.fatales.tn',
    accent: '#EC4899',
    founded: '2003',
    locations: 30,
    products: [
      { name: 'Coffret parfum premium', price: '320 TND', tag: 'Parfum' },
      { name: 'Palette maquillage', price: '185 TND', tag: 'Makeup' },
      { name: 'Routine soin visage', price: '149 TND', tag: 'Soin' },
    ],
  },
  {
    id: 19,
    name: 'Amazon',
    logo: 'AM',
    category: 'International',
    categoryLabel: 'International',
    city: 'Global',
    country: 'International',
    isLocal: false,
    checkoutLabel: "Acheter dans l'app",
    description: 'Marketplace internationale pour produits tech, maison et lifestyle.',
    longDescription:
      'Amazon est une marketplace internationale. Dans CreditTN, elle est presente comme destination externe avec parcours mobile et conditions de paiement affichees clairement.',
    website: 'https://www.amazon.com',
    accent: '#F59E0B',
    founded: '1994',
    locations: 0,
    products: [
      { name: 'Echo smart speaker', price: '299 TND', tag: 'Smart home' },
      { name: 'Kindle reader', price: '499 TND', tag: 'Lifestyle' },
      { name: 'Laptop sleeve premium', price: '89 TND', tag: 'Accessoire' },
    ],
  },
  {
    id: 20,
    name: 'AliExpress',
    logo: 'AX',
    category: 'International',
    categoryLabel: 'International',
    city: 'Global',
    country: 'International',
    isLocal: false,
    checkoutLabel: "Acheter dans l'app",
    description: 'Marketplace internationale pour accessoires, gadgets et maison.',
    longDescription:
      'AliExpress donne acces a une large selection internationale. CreditTN l affiche dans une experience propre avec badge international et option de continuation mobile.',
    website: 'https://www.aliexpress.com',
    accent: '#F97316',
    founded: '2010',
    locations: 0,
    products: [
      { name: 'Ecouteurs Bluetooth', price: '79 TND', tag: 'Audio' },
      { name: 'Lampe bureau LED', price: '65 TND', tag: 'Maison' },
      { name: 'Smartwatch sport', price: '159 TND', tag: 'Wearable' },
    ],
  },
  {
    id: 21,
    name: 'eBay',
    logo: 'EB',
    category: 'International',
    categoryLabel: 'International',
    city: 'Global',
    country: 'International',
    isLocal: false,
    checkoutLabel: "Acheter dans l'app",
    description: 'Marketplace internationale pour neuf, occasion et collections.',
    longDescription:
      'eBay est une marketplace internationale avec produits neufs, reconditionnes et objets rares. CreditTN l integre comme boutique externe dans un parcours premium.',
    website: 'https://www.ebay.com',
    accent: '#3B82F6',
    founded: '1995',
    locations: 0,
    products: [
      { name: 'Console retro reconditionnee', price: '520 TND', tag: 'Gaming' },
      { name: 'Montre connectee', price: '390 TND', tag: 'Wearable' },
      { name: 'Objectif camera vintage', price: '740 TND', tag: 'Photo' },
    ],
  },
];
