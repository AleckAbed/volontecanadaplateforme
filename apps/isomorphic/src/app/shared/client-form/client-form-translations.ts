/**
 * Traductions FR/EN pour les steps 3 à 10 et congratulations du client-form.
 */

export type FormLocale = 'fr' | 'en' | 'es';

export const STEP3_T = {
  fr: {
    summaryTitle: 'Passeport, Pièce d\'identité et Scolarité/Emploi',
    summaryDesc: 'Veuillez fournir les informations sur votre passeport, pièce d\'identité nationale et vos détails de scolarité/emploi',
    passport: 'Passeport',
    passportNumber: 'Numéro du passeport/titre de voyage:',
    issueCountry: 'Pays de délivrance:',
    issueDate: 'Date de délivrance (AAAA/MM/JJ):',
    expiryDate: 'Date d\'expiration (AAAA/MM/JJ):',
    nationalId: 'Pièce d\'identité nationale',
    nationalIdNumber: 'Numéro Pièce d\'identité nationale:',
    nationalIdCountry: 'Pays de délivrance:',
    educationEmployment: 'Détails de scolarité/emploi',
    educationInfo: 'Renseignements sur les études',
    highestLevel: 'Niveau de scolarité le plus élevé:',
    totalYears: 'Nombre d\'années d\'études au total:',
    employmentInfo: 'Renseignements sur la profession',
    current: 'Emploi actuel:',
    planned: 'Emploi prévu:',
    date: 'Date (AAAA/MM/JJ):',
    select: 'Sélectionner',
    country: 'Pays:',
  },
  en: {
    summaryTitle: 'Passport, Identity Document and Education/Employment',
    summaryDesc: 'Please provide your passport, national identity document and education/employment details',
    passport: 'Passport',
    passportNumber: 'Passport/travel document number:',
    issueCountry: 'Country of issue:',
    issueDate: 'Date of issue (YYYY/MM/DD):',
    expiryDate: 'Expiry date (YYYY/MM/DD):',
    nationalId: 'National identity document',
    nationalIdNumber: 'National identity document number:',
    nationalIdCountry: 'Country of issue:',
    educationEmployment: 'Education/employment details',
    educationInfo: 'Education information',
    highestLevel: 'Highest level of education:',
    totalYears: 'Total years of study:',
    employmentInfo: 'Employment information',
    current: 'Current employment:',
    planned: 'Planned employment:',
    date: 'Date (YYYY/MM/DD):',
    select: 'Select',
    country: 'Country:',
  },
  es: {
    summaryTitle: 'Pasaporte, documento de identidad y educación/empleo',
    summaryDesc: 'Por favor proporcione la información sobre su pasaporte, documento nacional de identidad y los detalles de su educación/empleo',
    passport: 'Pasaporte',
    passportNumber: 'Número de pasaporte/documento de viaje:',
    issueCountry: 'País de expedición:',
    issueDate: 'Fecha de expedición (AAAA/MM/DD):',
    expiryDate: 'Fecha de expiración (AAAA/MM/DD):',
    nationalId: 'Documento nacional de identidad',
    nationalIdNumber: 'Número del documento nacional de identidad:',
    nationalIdCountry: 'País de expedición:',
    educationEmployment: 'Detalles de educación/empleo',
    educationInfo: 'Información sobre los estudios',
    highestLevel: 'Nivel de estudios más alto:',
    totalYears: 'Número total de años de estudios:',
    employmentInfo: 'Información sobre la profesión',
    current: 'Empleo actual:',
    planned: 'Empleo previsto:',
    date: 'Fecha (AAAA/MM/DD):',
    select: 'Seleccionar',
    country: 'País:',
  },
};

export const STEP4_T = {
  fr: { summaryTitle: 'Scolarité', summaryDesc: "Indiquez le nombre d'années que vous avez réussies pour chacun des niveaux d'études suivants" },
  en: { summaryTitle: 'Education', summaryDesc: 'Indicate the number of years completed for each of the following levels of study' },
  es: { summaryTitle: 'Educación', summaryDesc: 'Indique el número de años completados para cada uno de los siguientes niveles de estudios' },
};
export const STEP5_T = {
  fr: {
    summaryTitle: 'Adresse',
    summaryDesc: "Inscrivez toutes les adresses où vous avez résidé depuis votre 18e anniversaire ou au cours des 10 dernières années, selon la période la plus récente. N'utilisez pas d'adresses comportant des boîtes postales.",
    addressHistoryTitle: 'Historique des adresses',
    addressHistoryIntro: "Inscrivez toutes les adresses où vous avez résidé depuis votre 18e anniversaire ou au cours des 10 dernières années, selon la période la plus récente. N'utilisez pas d'adresses comportant des boîtes postales.",
    errorNoDateOfBirth: 'Veuillez remplir votre date de naissance à l\'étape 1 pour valider les adresses.',
    errorAtLeastOneAddress: 'Veuillez ajouter au moins une adresse avec les dates « Du » et « Au ».',
    errorMissingDatesInRow: 'Chaque adresse doit avoir les dates « Du » et « Au » renseignées. Ligne {{row}}.',
    errorAddressDateRange: 'Les dates de chaque adresse doivent être entre le {{start}} et le {{end}} (depuis votre 18e anniversaire ou les 10 dernières années). Ligne {{row}}.',
    errorFromAfterTo: 'Pour chaque adresse, la date "Du" doit être antérieure ou égale à la date "Au". Ligne {{row}}.',
    errorAddressDateGap: 'Les périodes d\'adresse doivent couvrir toute la période requise du {{start}} au {{end}} sans lacune. Vérifiez qu\'il n\'y a pas de trou entre vos dates.',
  },
  en: {
    summaryTitle: 'Address',
    summaryDesc: 'List all addresses where you have lived since your 18th birthday or in the last 10 years, whichever is most recent. Do not use P.O. box addresses.',
    addressHistoryTitle: 'Address history',
    addressHistoryIntro: 'List all addresses where you have lived since your 18th birthday or in the last 10 years, whichever is most recent. Do not use P.O. box addresses.',
    errorNoDateOfBirth: 'Please enter your date of birth in step 1 to validate addresses.',
    errorAtLeastOneAddress: 'Please add at least one address with "From" and "To" dates.',
    errorMissingDatesInRow: 'Each address must have "From" and "To" dates. Row {{row}}.',
    errorAddressDateRange: 'Each address dates must be between {{start}} and {{end}} (since your 18th birthday or the last 10 years). Row {{row}}.',
    errorFromAfterTo: 'For each address, "From" date must be before or equal to "To" date. Row {{row}}.',
    errorAddressDateGap: 'Address periods must cover the entire required period from {{start}} to {{end}} with no gaps. Check that there are no missing dates between your entries.',
  },
  es: {
    summaryTitle: 'Dirección',
    summaryDesc: 'Indique todas las direcciones donde ha residido desde su 18º cumpleaños o durante los últimos 10 años, lo más reciente. No use direcciones de apartado postal.',
    addressHistoryTitle: 'Historial de direcciones',
    addressHistoryIntro: 'Indique todas las direcciones donde ha residido desde su 18º cumpleaños o durante los últimos 10 años, lo más reciente. No use direcciones de apartado postal.',
    errorNoDateOfBirth: 'Por favor complete su fecha de nacimiento en el paso 1 para validar las direcciones.',
    errorAtLeastOneAddress: 'Por favor añada al menos una dirección con fechas "Desde" y "Hasta".',
    errorMissingDatesInRow: 'Cada dirección debe tener las fechas "Desde" y "Hasta". Fila {{row}}.',
    errorAddressDateRange: 'Las fechas de cada dirección deben estar entre el {{start}} y el {{end}} (desde su 18º cumpleaños o los últimos 10 años). Fila {{row}}.',
    errorFromAfterTo: 'Para cada dirección, la fecha "Desde" debe ser anterior o igual a la fecha "Hasta". Fila {{row}}.',
    errorAddressDateGap: 'Los periodos deben cubrir todo el rango requerido del {{start}} al {{end}} sin lagunas. Verifique que no haya huecos en sus fechas.',
  },
};
export const STEP6_T = {
  fr: { summaryTitle: 'Antécédents personnels', summaryDesc: "Veuillez préciser vos antécédents personnels au cours des 10 dernières années ou depuis votre 18e anniversaire de naissance si cela remonte à moins de 10 ans. Commencez par l'information la plus récente." },
  en: { summaryTitle: 'Personal background', summaryDesc: 'Provide your personal history for the past 10 years or since your 18th birthday if that was less than 10 years ago. Start with the most recent information.' },
  es: { summaryTitle: 'Antecedentes personales', summaryDesc: 'Indique sus antecedentes personales de los últimos 10 años o desde su 18º cumpleaños si esto fue hace menos de 10 años. Empiece por la información más reciente.' },
};
export const STEP7_T = {
  fr: { summaryTitle: 'Famille', summaryDesc: 'Veuillez fournir les informations sur les membres de votre famille' },
  en: { summaryTitle: 'Family', summaryDesc: 'Please provide information about your family members' },
  es: { summaryTitle: 'Familia', summaryDesc: 'Por favor proporcione información sobre los miembros de su familia' },
};
export const STEP8_T = {
  fr: { summaryTitle: 'Liste des voyages', summaryDesc: 'Veuillez énumérer tous les voyages que vous et les membres de votre famille âgés de 18 ans ou plus avez effectués depuis les 10 dernières années hors de votre pays d\'origine ou de résidence' },
  en: { summaryTitle: 'List of travels', summaryDesc: 'List all trips you and family members aged 18 or over have made in the last 10 years outside your country of origin or residence' },
  es: { summaryTitle: 'Lista de viajes', summaryDesc: 'Enumere todos los viajes que usted y los miembros de su familia mayores de 18 años han realizado en los últimos 10 años fuera de su país de origen o residencia' },
};
export const STEP9_T = {
  fr: { summaryTitle: 'Section A - Lien de parenté', summaryDesc: 'Veuillez confirmer les informations sur les membres de votre famille' },
  en: { summaryTitle: 'Section A - Family relationship', summaryDesc: 'Please confirm the information about your family members' },
  es: { summaryTitle: 'Sección A - Vínculo de parentesco', summaryDesc: 'Por favor confirme la información sobre los miembros de su familia' },
};
export const STEP10_T = {
  fr: { summaryTitle: 'Questions de sécurité', summaryDesc: 'Est-ce que vous-même ou, si vous êtes le requérant principal, l\'un des membres de votre famille nommés sur la demande de résidence permanente au Canada :' },
  en: { summaryTitle: 'Security questions', summaryDesc: 'Have you, or, if you are the principal applicant, any of your family members named in the application for permanent residence in Canada:' },
  es: { summaryTitle: 'Preguntas de seguridad', summaryDesc: 'Ha usted, o si es el solicitante principal, alguno de los miembros de su familia mencionados en la solicitud de residencia permanente en Canadá:' },
};

export const CONGRATULATIONS_T = {
  fr: {
    submitting: 'Soumission en cours...',
    pleaseWait: 'Veuillez patienter pendant que nous enregistrons votre formulaire.',
    success: 'Formulaire soumis avec succès !',
    successDesc: 'Votre formulaire a été soumis avec succès. Nous vous contacterons bientôt pour la suite du processus.',
    backHome: "Retour à l'accueil",
    downloadPdf: 'Télécharger la version PDF',
    previewPdf: 'Prévisualiser le PDF',
    errorSubmit: 'Erreur lors de la soumission',
  },
  en: {
    submitting: 'Submitting...',
    pleaseWait: 'Please wait while we save your form.',
    success: 'Form submitted successfully!',
    successDesc: 'Your form has been submitted successfully. We will contact you soon for the next steps.',
    backHome: 'Back to home',
    downloadPdf: 'Download PDF version',
    previewPdf: 'Preview PDF',
    errorSubmit: 'Error submitting',
  },
  es: {
    submitting: 'Enviando...',
    pleaseWait: 'Por favor espere mientras guardamos su formulario.',
    success: '¡Formulario enviado con éxito!',
    successDesc: 'Su formulario ha sido enviado con éxito. Nos pondremos en contacto pronto para los siguientes pasos.',
    backHome: 'Volver al inicio',
    downloadPdf: 'Descargar versión PDF',
    previewPdf: 'Vista previa PDF',
    errorSubmit: 'Error al enviar',
  },
};
