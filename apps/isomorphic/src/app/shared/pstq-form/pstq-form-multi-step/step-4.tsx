'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import FormSummary from '@/app/shared/pstq-form/pstq-form-multi-step/form-summary';
import { pstqFormDataAtom, usePSTQStepper } from '@/app/shared/pstq-form/pstq-form-multi-step';
import { calculatePSTQScore } from '@/services/pstq-scoring';

export default function StepFour() {
  const [formData] = useAtom(pstqFormDataAtom);
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    try {
      const calculatedScore = calculatePSTQScore(formData as any);
      setScore(calculatedScore);
    } catch (error) {
      console.error('Erreur lors du calcul du score:', error);
    }
  }, [formData]);

  if (!score) {
    return (
      <div className="col-span-full flex items-center justify-center">
        <p className="text-white">Calcul du score en cours...</p>
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
          {/* Score total */}
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score total</p>
            <p className="mt-2 text-5xl font-bold text-primary">{score.total}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">sur 1400 points maximum</p>
          </div>

          {/* Bloc A */}
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Bloc A - Capital humain (520 points max)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Français</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocA.francais} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Âge</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocA.age} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expérience</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocA.experience} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Scolarité</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocA.scolarite} points</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Total Bloc A</span>
                <span className="font-bold text-primary">{score.blocA.total} / 520</span>
              </div>
            </div>
          </div>

          {/* Bloc B */}
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Bloc B - Réponse aux besoins du Québec (700 points max)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Profession</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocB.profession} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Diplôme QC</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocB.diplome_quebec} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expérience QC</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocB.experience_quebec} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Hors Montréal</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocB.hors_montreal} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Offre d&apos;emploi</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocB.offre_emploi} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Autorisation</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocB.autorisation} points</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Total Bloc B</span>
                <span className="font-bold text-primary">{score.blocB.total} / 700</span>
              </div>
            </div>
          </div>

          {/* Bloc C */}
          <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Bloc C - Facteurs d&apos;adaptation (180 points max)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Études QC</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocC.etudes_quebec} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Famille</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocC.famille} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Conjoint</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score.blocC.conjoint} points</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Total Bloc C</span>
                <span className="font-bold text-primary">{score.blocC.total} / 180</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



