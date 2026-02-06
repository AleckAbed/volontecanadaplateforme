// Données de test pour les services d'immigration

export type ServiceType = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  status: 'active' | 'inactive' | 'pending';
  color?: string;
  icon?: string;
};

export const servicesList: ServiceType[] = [
  {
    id: 1,
    name: 'Visa de Visiteur',
    description: 'Visa temporaire pour visiter le Canada',
    category: 'Visa',
    price: '150 CAD',
    duration: '2-4 semaines',
    status: 'active',
    color: '#2465FF',
  },
  {
    id: 2,
    name: 'Permis de Travail',
    description: 'Permis pour travailler au Canada',
    category: 'Travail',
    price: '250 CAD',
    duration: '4-8 semaines',
    status: 'active',
    color: '#F5A623',
  },
  {
    id: 3,
    name: 'Résidence Permanente',
    description: 'Demande de résidence permanente',
    category: 'Immigration',
    price: '500 CAD',
    duration: '6-12 mois',
    status: 'active',
    color: '#11A849',
  },
  {
    id: 4,
    name: 'Citoyenneté Canadienne',
    description: 'Demande de citoyenneté',
    category: 'Citoyenneté',
    price: '630 CAD',
    duration: '12-18 mois',
    status: 'active',
    color: '#8A63D2',
  },
  {
    id: 5,
    name: 'Parrainage Familial',
    description: 'Parrainage de membres de la famille',
    category: 'Famille',
    price: '1125 CAD',
    duration: '12-24 mois',
    status: 'active',
    color: '#FF1A1A',
  },
  {
    id: 6,
    name: 'Visa Étudiant',
    description: 'Permis d\'études pour le Canada',
    category: 'Éducation',
    price: '150 CAD',
    duration: '4-6 semaines',
    status: 'active',
    color: '#0070F3',
  },
];

export const servicesTableData = [
  {
    id: 1,
    serviceName: 'Visa de Visiteur',
    category: 'Visa',
    price: '150 CAD',
    duration: '2-4 semaines',
    status: 'active',
    clients: 45,
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    serviceName: 'Permis de Travail',
    category: 'Travail',
    price: '250 CAD',
    duration: '4-8 semaines',
    status: 'active',
    clients: 32,
    createdAt: '2024-01-20',
  },
  {
    id: 3,
    serviceName: 'Résidence Permanente',
    category: 'Immigration',
    price: '500 CAD',
    duration: '6-12 mois',
    status: 'active',
    clients: 18,
    createdAt: '2024-02-01',
  },
  {
    id: 4,
    serviceName: 'Citoyenneté Canadienne',
    category: 'Citoyenneté',
    price: '630 CAD',
    duration: '12-18 mois',
    status: 'pending',
    clients: 12,
    createdAt: '2024-02-10',
  },
  {
    id: 5,
    serviceName: 'Parrainage Familial',
    category: 'Famille',
    price: '1125 CAD',
    duration: '12-24 mois',
    status: 'active',
    clients: 28,
    createdAt: '2024-02-15',
  },
  {
    id: 6,
    serviceName: 'Visa Étudiant',
    category: 'Éducation',
    price: '150 CAD',
    duration: '4-6 semaines',
    status: 'active',
    clients: 55,
    createdAt: '2024-02-20',
  },
];

export type ServicesTableDataType = (typeof servicesTableData)[number];




