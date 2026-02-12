'use client';

import { useAtom, useSetAtom } from 'jotai';
import { atomWithReset, useResetAtom } from 'jotai/utils';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { FamilyMemberInput } from '@/validators/create-client.schema';

const StepType = dynamic(
  () => import('@/app/shared/clients/create-client-form/step-type'),
  { ssr: false }
);
const StepDemandeur = dynamic(
  () => import('@/app/shared/clients/create-client-form/step-demandeur'),
  { ssr: false }
);
const StepFamilyMembers = dynamic(
  () => import('@/app/shared/clients/create-client-form/step-family-members'),
  { ssr: false }
);

export type ClientFormDataType = {
  client_type: 'single' | 'family';
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  passport_number: string;
  address: string;
  family_members: FamilyMemberInput[];
};

export const initialClientFormData: ClientFormDataType = {
  client_type: 'single',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  date_of_birth: '',
  nationality: '',
  passport_number: '',
  address: '',
  family_members: [],
};

export const clientFormDataAtom = atomWithReset<ClientFormDataType>(
  initialClientFormData
);

enum Step {
  Type = 0,
  Demandeur = 1,
  FamilyMembers = 2,
}

const firstStep = Step.Type;
export const stepperAtomClient = atomWithReset<Step>(firstStep);

export function useStepperClient() {
  const [step, setStep] = useAtom(stepperAtomClient);
  function gotoNextStep() {
    setStep(step + 1);
  }
  function gotoPrevStep() {
    setStep(step > firstStep ? step - 1 : step);
  }
  function resetStepper() {
    setStep(firstStep);
  }
  return {
    step,
    setStep,
    resetStepper,
    gotoNextStep,
    gotoPrevStep,
  };
}

const MAP_STEP_TO_COMPONENT = {
  [Step.Type]: StepType,
  [Step.Demandeur]: StepDemandeur,
  [Step.FamilyMembers]: StepFamilyMembers,
};

export const stepClientTotalSteps = Object.keys(MAP_STEP_TO_COMPONENT).length;

export default function CreateClientForm() {
  const [step] = useAtom(stepperAtomClient);
  const Component = MAP_STEP_TO_COMPONENT[step];
  const resetStepper = useResetAtom(stepperAtomClient);
  const resetFormData = useResetAtom(clientFormDataAtom);

  useEffect(() => {
    resetStepper();
    resetFormData();
  }, [resetStepper, resetFormData]);

  return (
    <div className="relative flex justify-center md:items-center">
      <div className="w-full">
        <Component />
      </div>
    </div>
  );
}
