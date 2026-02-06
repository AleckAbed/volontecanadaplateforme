/**
 * Service de calcul de points PSTQ (Programme de sélection des travailleurs qualifiés)
 * Basé sur le document PSTQ_Pointage_Recap.md
 */

import type { PSTQFormInput } from '@/validators/pstq-form.schema';

interface PSTQScore {
  blocA: {
    francais: number;
    age: number;
    experience: number;
    scolarite: number;
    total: number;
  };
  blocB: {
    profession: number;
    diplome_quebec: number;
    experience_quebec: number;
    hors_montreal: number;
    offre_emploi: number;
    autorisation: number;
    total: number;
  };
  blocC: {
    etudes_quebec: number;
    famille: number;
    conjoint: number;
    total: number;
  };
  total: number;
}

/**
 * Calculer l'âge à partir d'une date de naissance
 */
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Bloc A1 - Connaissance du français
 * Barème par compétence (4 compétences au total)
 */
function calculateFrancaisPoints(data: PSTQFormInput): number {
  const avecConjoint = data.avec_conjoint;
  const competences = [
    data.comprehension_orale,
    data.production_orale,
    data.comprehension_ecrite,
    data.production_ecrite,
  ];

  let total = 0;
  competences.forEach((niveau) => {
    if (niveau >= 1 && niveau <= 4) {
      total += 0;
    } else if (niveau >= 5 && niveau <= 6) {
      total += avecConjoint ? 30 : 38;
    } else if (niveau >= 7 && niveau <= 8) {
      total += avecConjoint ? 35 : 44;
    } else if (niveau >= 9 && niveau <= 12) {
      total += avecConjoint ? 40 : 50;
    }
  });

  return total;
}

/**
 * Bloc A2 - Âge
 */
function calculateAgePoints(data: PSTQFormInput): number {
  const age = calculateAge(data.date_naissance);
  const avecConjoint = data.avec_conjoint;

  const ageTable: Record<number, { seul: number; avecConjoint: number }> = {
    20: { seul: 120, avecConjoint: 100 },
    21: { seul: 120, avecConjoint: 100 },
    22: { seul: 120, avecConjoint: 100 },
    23: { seul: 120, avecConjoint: 100 },
    24: { seul: 120, avecConjoint: 100 },
    25: { seul: 120, avecConjoint: 100 },
    26: { seul: 120, avecConjoint: 100 },
    27: { seul: 120, avecConjoint: 100 },
    28: { seul: 120, avecConjoint: 100 },
    29: { seul: 120, avecConjoint: 100 },
    30: { seul: 120, avecConjoint: 100 },
    31: { seul: 110, avecConjoint: 95 },
    32: { seul: 100, avecConjoint: 90 },
    33: { seul: 90, avecConjoint: 81 },
    34: { seul: 80, avecConjoint: 72 },
    35: { seul: 75, avecConjoint: 68 },
    36: { seul: 70, avecConjoint: 63 },
    37: { seul: 65, avecConjoint: 59 },
    38: { seul: 60, avecConjoint: 54 },
    39: { seul: 55, avecConjoint: 50 },
    40: { seul: 50, avecConjoint: 45 },
    41: { seul: 40, avecConjoint: 36 },
    42: { seul: 30, avecConjoint: 27 },
    43: { seul: 20, avecConjoint: 18 },
    44: { seul: 10, avecConjoint: 9 },
  };

  if (age >= 20 && age <= 30) {
    return avecConjoint ? 100 : 120;
  }

  if (age >= 31 && age <= 44) {
    return ageTable[age] ? (avecConjoint ? ageTable[age].avecConjoint : ageTable[age].seul) : 0;
  }

  return 0; // ≥45 ans
}

/**
 * Bloc A3 - Expérience de travail
 */
function calculateExperiencePoints(data: PSTQFormInput): number {
  const mois = data.experience_travail_mois;
  const avecConjoint = data.avec_conjoint;

  if (mois < 12) return 0;
  if (mois >= 12 && mois <= 23) return avecConjoint ? 15 : 20;
  if (mois >= 24 && mois <= 35) return avecConjoint ? 30 : 40;
  if (mois >= 36 && mois <= 47) return avecConjoint ? 35 : 50;
  if (mois >= 48) return avecConjoint ? 50 : 70;

  return 0;
}

/**
 * Bloc A4 - Niveau de scolarité
 */
function calculateScolaritePoints(data: PSTQFormInput): number {
  const niveau = data.niveau_scolarite;
  const avecConjoint = data.avec_conjoint;

  const points: Record<string, { seul: number; avecConjoint: number }> = {
    secondaire: { seul: 13, avecConjoint: 11 },
    postsec_general_2ans: { seul: 39, avecConjoint: 33 },
    technique_3ans: { seul: 78, avecConjoint: 66 },
    univ_1er_cycle: { seul: 104, avecConjoint: 88 },
    univ_2e_cycle: { seul: 117, avecConjoint: 99 },
    univ_3e_cycle: { seul: 130, avecConjoint: 110 },
  };

  return points[niveau] ? (avecConjoint ? points[niveau].avecConjoint : points[niveau].seul) : 0;
}

/**
 * Bloc B1 - Profession principale + diagnostic
 */
function calculateProfessionPoints(data: PSTQFormInput): number {
  if (data.diagnostic !== 'deficit') {
    // Pour équilibre et léger déficit, les points varient selon le diagnostic
    // Pour simplifier, on retourne 0 ici - à compléter selon les règles exactes
    return 0;
  }

  const mois = data.experience_profession_mois;
  if (mois >= 12 && mois <= 23) return 90;
  if (mois >= 24 && mois <= 35) return 100;
  if (mois >= 36 && mois <= 47) return 110;
  if (mois >= 48) return 120;

  return 0;
}

/**
 * Bloc B2 - Diplôme obtenu au Québec
 */
function calculateDiplomeQuebecPoints(data: PSTQFormInput): number {
  const diplome = data.diplome_quebec;
  if (!diplome || diplome === 'aucun') return 0;

  const points: Record<string, number> = {
    secondaire: 20,
    dep_900h: 40,
    technique_3ans: 120,
    univ_3_4ans: 160,
    '2e_cycle': 180,
    '3e_cycle': 200,
  };

  return points[diplome] || 0;
}

/**
 * Bloc B3 - Expérience de travail au Québec
 */
function calculateExperienceQuebecPoints(data: PSTQFormInput): number {
  const mois = data.experience_quebec_mois;
  if (mois < 12) return 0;
  if (mois >= 12 && mois <= 23) return 40;
  if (mois >= 24 && mois <= 35) return 80;
  if (mois >= 36 && mois <= 47) return 120;
  if (mois >= 48) return 160;

  return 0;
}

/**
 * Bloc B4 - Expérience hors Montréal
 */
function calculateHorsMontrealPoints(data: PSTQFormInput): number {
  let total = 0;
  if (data.residence_hors_montreal_mois >= 48) total += 40;
  if (data.travail_hors_montreal_mois >= 48) total += 60;
  if (data.etudes_hors_montreal_mois >= 48) total += 20;

  return total;
}

/**
 * Bloc B5 - Offre d'emploi validée
 */
function calculateOffreEmploiPoints(data: PSTQFormInput): number {
  if (!data.offre_emploi) return 0;
  if (data.offre_emploi_lieu === 'hors_montreal') return 50;
  if (data.offre_emploi_lieu === 'montreal') return 30;

  return 0;
}

/**
 * Bloc B6 - Autorisation d'exercer
 */
function calculateAutorisationPoints(data: PSTQFormInput): number {
  return data.autorisation_exercer ? 50 : 0;
}

/**
 * Bloc C1 - Études au Québec sans diplôme
 */
function calculateEtudesQuebecPoints(data: PSTQFormInput): number {
  // Jusqu'à 30 points selon la durée - à compléter avec les règles exactes
  const mois = data.etudes_quebec_sans_diplome_mois;
  // Exemple simplifié - à ajuster selon les règles exactes
  if (mois >= 12) return Math.min(30, Math.floor(mois / 12) * 5);
  return 0;
}

/**
 * Bloc C2 - Famille au Québec
 */
function calculateFamillePoints(data: PSTQFormInput): number {
  if (!data.famille_quebec) return 0;
  if (data.famille_quebec_lien === 'direct') return 10;
  if (data.famille_quebec_lien === 'via_conjoint') return 5;

  return 0;
}

/**
 * Bloc C3 - Profil du conjoint
 */
function calculateConjointPoints(data: PSTQFormInput): number {
  if (!data.avec_conjoint) return 0;

  let total = 0;

  // Français (max 40)
  const competences = [
    data.conjoint_francais_comprehension_orale,
    data.conjoint_francais_production_orale,
    data.conjoint_francais_comprehension_ecrite,
    data.conjoint_francais_production_ecrite,
  ].filter((n) => n !== undefined) as number[];

  if (competences.length > 0) {
    const moyenne = competences.reduce((a, b) => a + b, 0) / competences.length;
    // Simplification - à ajuster selon les règles exactes
    if (moyenne >= 7) total += 40;
    else if (moyenne >= 5) total += 20;
  }

  // Âge (max 20)
  if (data.conjoint_age) {
    const age = data.conjoint_age;
    if (age >= 18 && age <= 35) total += 20;
    else if (age >= 36 && age <= 40) total += 10;
  }

  // Expérience QC (max 30)
  if (data.conjoint_experience_quebec_mois) {
    const mois = data.conjoint_experience_quebec_mois;
    if (mois >= 12) total += Math.min(30, Math.floor(mois / 12) * 5);
  }

  // Scolarité (max 20)
  if (data.conjoint_scolarite) {
    const points: Record<string, number> = {
      secondaire: 5,
      postsec_general_2ans: 10,
      technique_3ans: 15,
      univ_1er_cycle: 18,
      univ_2e_cycle: 20,
      univ_3e_cycle: 20,
    };
    total += points[data.conjoint_scolarite] || 0;
  }

  // Diplôme QC (max 30)
  if (data.conjoint_diplome_quebec && data.conjoint_diplome_quebec !== 'aucun') {
    const points: Record<string, number> = {
      secondaire: 5,
      dep_900h: 10,
      technique_3ans: 20,
      univ_3_4ans: 25,
      '2e_cycle': 28,
      '3e_cycle': 30,
    };
    total += points[data.conjoint_diplome_quebec] || 0;
  }

  return Math.min(140, total); // Max 140 points
}

/**
 * Calculer le score total PSTQ
 */
export function calculatePSTQScore(data: PSTQFormInput): PSTQScore {
  // Bloc A - Capital humain
  const blocA_francais = calculateFrancaisPoints(data);
  const blocA_age = calculateAgePoints(data);
  const blocA_experience = calculateExperiencePoints(data);
  const blocA_scolarite = calculateScolaritePoints(data);
  const blocA_total = blocA_francais + blocA_age + blocA_experience + blocA_scolarite;

  // Bloc B - Réponse aux besoins du Québec
  const blocB_profession = calculateProfessionPoints(data);
  const blocB_diplome = calculateDiplomeQuebecPoints(data);
  const blocB_experience = calculateExperienceQuebecPoints(data);
  const blocB_hors_montreal = calculateHorsMontrealPoints(data);
  const blocB_offre = calculateOffreEmploiPoints(data);
  const blocB_autorisation = calculateAutorisationPoints(data);
  const blocB_total = blocB_profession + blocB_diplome + blocB_experience + blocB_hors_montreal + blocB_offre + blocB_autorisation;

  // Bloc C - Facteurs d'adaptation
  const blocC_etudes = calculateEtudesQuebecPoints(data);
  const blocC_famille = calculateFamillePoints(data);
  const blocC_conjoint = calculateConjointPoints(data);
  const blocC_total = blocC_etudes + blocC_famille + blocC_conjoint;

  const total = blocA_total + blocB_total + blocC_total;

  return {
    blocA: {
      francais: blocA_francais,
      age: blocA_age,
      experience: blocA_experience,
      scolarite: blocA_scolarite,
      total: blocA_total,
    },
    blocB: {
      profession: blocB_profession,
      diplome_quebec: blocB_diplome,
      experience_quebec: blocB_experience,
      hors_montreal: blocB_hors_montreal,
      offre_emploi: blocB_offre,
      autorisation: blocB_autorisation,
      total: blocB_total,
    },
    blocC: {
      etudes_quebec: blocC_etudes,
      famille: blocC_famille,
      conjoint: blocC_conjoint,
      total: blocC_total,
    },
    total,
  };
}

