'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { questionnaireLocaleAtom } from '@/app/shared/questionnaire-locale';
import { PSTQ_STEP4_T } from '@/app/shared/pstq-form/pstq-form-translations';
import { calculatePSTQScore } from '@/services/pstq-scoring';

const STEP4_LABELS = {
  fr: {
    computing: 'Calcul du score en cours...',
    scoreTotal: 'Score total',
    outOf: 'sur 1400 points maximum',
    points: 'points',
    blocA: 'Bloc A - Capital humain (520 points max)',
    blocB: 'Bloc B - Réponse aux besoins du Québec (700 points max)',
    blocC: "Bloc C - Facteurs d'adaptation (180 points max)",
    francais: 'Français',
    age: 'Âge',
    experience: 'Expérience',
    scolarite: 'Scolarité',
    profession: 'Profession',
    diplomeQc: 'Diplôme QC',
    expQc: 'Expérience QC',
    horsMontreal: 'Hors Montréal',
    offreEmploi: "Offre d'emploi",
    autorisation: 'Autorisation',
    etudesQc: 'Études QC',
    famille: 'Famille',
    conjoint: 'Conjoint',
    totalA: 'Total Bloc A',
    totalB: 'Total Bloc B',
    totalC: 'Total Bloc C',
  },
  en: {
    computing: 'Calculating score...',
    scoreTotal: 'Total score',
    outOf: 'out of 1400 points maximum',
    points: 'points',
    blocA: 'Block A - Human capital (520 points max)',
    blocB: "Block B - Response to Quebec's needs (700 points max)",
    blocC: 'Block C - Adaptability factors (180 points max)',
    francais: 'French',
    age: 'Age',
    experience: 'Experience',
    scolarite: 'Education',
    profession: 'Profession',
    diplomeQc: 'QC Diploma',
    expQc: 'QC Experience',
    horsMontreal: 'Outside Montreal',
    offreEmploi: 'Job offer',
    autorisation: 'Authorization',
    etudesQc: 'QC Studies',
    famille: 'Family',
    conjoint: 'Spouse',
    totalA: 'Block A total',
    totalB: 'Block B total',
    totalC: 'Block C total',
  },
  es: {
    computing: 'Calculando puntaje...',
    scoreTotal: 'Puntaje total',
    outOf: 'sobre 1400 puntos máximo',
    points: 'puntos',
    blocA: 'Bloque A - Capital humano (520 puntos máx)',
    blocB: 'Bloque B - Respuesta a las necesidades de Quebec (700 puntos máx)',
    blocC: 'Bloque C - Factores de adaptación (180 puntos máx)',
    francais: 'Francés',
    age: 'Edad',
    experience: 'Experiencia',
    scolarite: 'Estudios',
    profession: 'Profesión',
    diplomeQc: 'Diploma QC',
    expQc: 'Experiencia QC',
    horsMontreal: 'Fuera de Montreal',
    offreEmploi: 'Oferta de empleo',
    autorisation: 'Autorización',
    etudesQc: 'Estudios QC',
    famille: 'Familia',
    conjoint: 'Cónyuge',
    totalA: 'Total Bloque A',
    totalB: 'Total Bloque B',
    totalC: 'Total Bloque C',
  },
} as const;

export default function StepFour() {
  const [formData] = useAtom(pstqFormDataAtom);
  const [locale] = useAtom(questionnaireLocaleAtom);
  const t = PSTQ_STEP4_T[locale] || PSTQ_STEP4_T.fr;
  const l = STEP4_LABELS[locale] || STEP4_LABELS.fr;
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    try {
      const calculatedScore = calculatePSTQScore(formData as any);
      setScore(calculatedScore);
    } catch (error) {
      console.error('Score calculation error:', error);
    }
  }, [formData]);

  if (!score) {
    return (
      <div className="col-span-full flex items-center justify-center">
        <p className="text-white">{l.computing}</p>
      </div>
    );
  }

  return (
    <>
      <div className="col-span-full flex flex-col justify-center @4xl:col-span-5">
        <FormSummary
          descriptionClassName="@7xl:me-10"
          title={t.summaryTitle}
          description={t.summaryDesc}
        />
      </div>

      <div className="col-span-full rounded-lg bg-white p-5 @4xl:col-span-7 @4xl:p-7 dark:bg-gray-0">
        <div className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{l.scoreTotal}</p>
            <p className="mt-2 text-5xl font-bold text-primary">{score.total}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{l.outOf}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{l.blocA}</h3>
            <div className="space-y-2">
              <ScoreRow label={l.francais} value={score.blocA.francais} points={l.points} />
              <ScoreRow label={l.age} value={score.blocA.age} points={l.points} />
              <ScoreRow label={l.experience} value={score.blocA.experience} points={l.points} />
              <ScoreRow label={l.scolarite} value={score.blocA.scolarite} points={l.points} />
              <TotalRow label={l.totalA} value={score.blocA.total} max={520} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{l.blocB}</h3>
            <div className="space-y-2">
              <ScoreRow label={l.profession} value={score.blocB.profession} points={l.points} />
              <ScoreRow label={l.diplomeQc} value={score.blocB.diplome_quebec} points={l.points} />
              <ScoreRow label={l.expQc} value={score.blocB.experience_quebec} points={l.points} />
              <ScoreRow label={l.horsMontreal} value={score.blocB.hors_montreal} points={l.points} />
              <ScoreRow label={l.offreEmploi} value={score.blocB.offre_emploi} points={l.points} />
              <ScoreRow label={l.autorisation} value={score.blocB.autorisation} points={l.points} />
              <TotalRow label={l.totalB} value={score.blocB.total} max={700} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{l.blocC}</h3>
            <div className="space-y-2">
              <ScoreRow label={l.etudesQc} value={score.blocC.etudes_quebec} points={l.points} />
              <ScoreRow label={l.famille} value={score.blocC.famille} points={l.points} />
              <ScoreRow label={l.conjoint} value={score.blocC.conjoint} points={l.points} />
              <TotalRow label={l.totalC} value={score.blocC.total} max={180} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ScoreRow({ label, value, points }: { label: string; value: number; points: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value} {points}</span>
    </div>
  );
}

function TotalRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="mt-4 flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
      <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
      <span className="font-bold text-primary">{value} / {max}</span>
    </div>
  );
}
