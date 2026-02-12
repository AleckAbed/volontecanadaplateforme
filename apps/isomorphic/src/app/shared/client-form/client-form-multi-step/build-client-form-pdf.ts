/**
 * Génère un PDF du formulaire client rempli (questions, réponses et tableaux).
 * Mise en forme : en-tête avec logo, pied de page, couleurs.
 */
import { jsPDF } from 'jspdf';
// autoTable peut être en default ou named export selon la version
import * as autoTableModule from 'jspdf-autotable';
const autoTableFn = (autoTableModule as any).default ?? (autoTableModule as any).autoTable;
if (typeof autoTableFn === 'function') {
  try {
    (autoTableModule as any).applyPlugin?.(jsPDF);
  } catch {
    // fallback: pas de plugin, on utilisera autoTable(doc, opts) si disponible
  }
}

type FormData = Record<string, any>;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const HEADER_HEIGHT = 20;
const FOOTER_HEIGHT = 14;
const CONTENT_START = 28;
const CONTENT_END = PAGE_HEIGHT - FOOTER_HEIGHT - 5;
const FONT_SIZE = 10;
const LINE_HEIGHT = 6;
const SECTION_MARGIN = 8;

// Couleurs (R, G, B)
const HEADER_BG = [180, 30, 45] as [number, number, number]; // rouge en-tête
const HEADER_TEXT = [255, 255, 255] as [number, number, number];
const SECTION_TITLE_COLOR = [12, 46, 93] as [number, number, number];
const TABLE_HEAD_BG = [12, 46, 93] as [number, number, number];
const TABLE_HEAD_TEXT = [255, 255, 255] as [number, number, number];
const FOOTER_LINE = [180, 180, 180] as [number, number, number];
const FIELD_LABEL_COLOR = [80, 80, 80] as [number, number, number];
const FIELD_BG = [248, 248, 250] as [number, number, number];
const FIELD_BORDER = [200, 200, 205] as [number, number, number];
const HIGHLIGHT_YELLOW = [255, 255, 200] as [number, number, number];
const STATUS_COLORS: Record<string, [number, number, number]> = {
  completed: [0, 128, 0],
  in_progress: [30, 100, 200],
  pending: [220, 140, 0],
  expired: [180, 0, 0],
};
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const COL_GAP = 4;
const FIELD_PADDING = 2;
const FIELD_ROW_HEIGHT = 12; // hauteur d'une ligne de champ (label + zone valeur)

/** Charge le logo en base64 (data URL) depuis le serveur. */
async function fetchLogoDataUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const url = `${window.location.origin}/logo2.png`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawPageHeader(doc: jsPDF, pageNum: number, totalPages: number, logoDataUrl: string | null, locale: 'fr' | 'en') {
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
  // Logo à gauche (taille proportionnelle : largeur x hauteur pour éviter déformation)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', MARGIN, 2, 40, 16);
    } catch {
      // ignore
    }
  }
  // Texte à droite (aligné à droite)
  doc.setTextColor(...HEADER_TEXT);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(locale === 'fr' ? 'Volonté Canada' : 'Volunteer Canada', PAGE_WIDTH - MARGIN, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(locale === 'fr' ? 'Formulaire client – Récapitulatif' : 'Client form – Summary', PAGE_WIDTH - MARGIN, 15, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number, locale: 'fr' | 'en') {
  const y = PAGE_HEIGHT - FOOTER_HEIGHT + 4;
  doc.setDrawColor(...FOOTER_LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - FOOTER_HEIGHT);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    locale === 'fr' ? `Page ${pageNum} sur ${totalPages}` : `Page ${pageNum} of ${totalPages}`,
    PAGE_WIDTH / 2,
    y + 4,
    { align: 'center' }
  );
  doc.text(
    locale === 'fr' ? 'Document confidentiel' : 'Confidential document',
    PAGE_WIDTH - MARGIN,
    y + 4,
    { align: 'right' }
  );
  doc.setTextColor(0, 0, 0);
}

function val(v: any): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (typeof v === 'object' && !Array.isArray(v)) return JSON.stringify(v);
  return String(v).trim();
}

// Traduction des valeurs pour le PDF (sexe, couleur des yeux) selon la locale
const SEX_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { male: 'Homme', female: 'Femme', other: 'Autre' },
  en: { male: 'Male', female: 'Female', other: 'Other' },
};
const EYE_COLOR_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { blue: 'Bleu', green: 'Vert', brown: 'Marron', black: 'Noir', gray: 'Gris', hazel: 'Noisette' },
  en: { blue: 'Blue', green: 'Green', brown: 'Brown', black: 'Black', gray: 'Gray', hazel: 'Hazel' },
};
const YES_NO_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { yes: 'Oui', no: 'Non' },
  en: { yes: 'Yes', no: 'No' },
};
const MARITAL_STATUS_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { single: 'Célibataire', married: 'Marié(e)', 'common-law': 'Union de fait', divorced: 'Divorcé(e)', widowed: 'Veuf(ve)', separated: 'Séparé(e)' },
  en: { single: 'Single', married: 'Married', 'common-law': 'Common-law', divorced: 'Divorced', widowed: 'Widowed', separated: 'Separated' },
};

function formatPdfValue(key: 'sex' | 'eyeColor' | 'height', value: any, locale: 'fr' | 'en'): string {
  const raw = val(value);
  if (raw === '—') return raw;
  if (key === 'sex') return SEX_LABELS[locale][String(value).toLowerCase()] ?? raw;
  if (key === 'eyeColor') return EYE_COLOR_LABELS[locale][String(value).toLowerCase()] ?? raw;
  if (key === 'height') return raw + ' cm';
  return raw;
}

function translateYesNo(value: any, locale: 'fr' | 'en'): string {
  if (value == null || value === '') return '—';
  const v = String(value).toLowerCase();
  return YES_NO_LABELS[locale][v] ?? val(value);
}

function translateMaritalStatus(value: any, locale: 'fr' | 'en'): string {
  const v = value == null || value === '' ? 'single' : String(value).toLowerCase();
  return MARITAL_STATUS_LABELS[locale][v] ?? val(value);
}

/** Options pour une section : nombre de colonnes (1, 2 ou 3), plain = label + valeur sans cadre. */
export type AddSectionOptions = { cols?: 1 | 2 | 3; plain?: boolean };

function addSection(
  doc: jsPDF,
  currentY: number,
  title: string,
  entries: [string, string][],
  options: AddSectionOptions = {}
): number {
  let y = currentY;
  const cols = options.cols ?? 2;
  const plain = options.plain ?? false;
  if (y > CONTENT_END) {
    doc.addPage();
    y = CONTENT_START;
  }
  // Titre de section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text(title, MARGIN, y + LINE_HEIGHT);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  y += LINE_HEIGHT + 4;

  if (plain) {
    // Label et valeur en texte simple, sans cadre (2 colonnes par ligne)
    const colWidth = (CONTENT_WIDTH - (cols - 1) * COL_GAP) / cols;
    for (let i = 0; i < entries.length; i += cols) {
      if (y + LINE_HEIGHT * 2 > CONTENT_END) {
        doc.addPage();
        y = CONTENT_START;
      }
      const rowEntries = entries.slice(i, i + cols);
      let rowHeight = 0;
      for (let c = 0; c < rowEntries.length; c++) {
        const [label, value] = rowEntries[c];
        const x = MARGIN + c * (colWidth + COL_GAP);
        const line = `${label}: ${value}`;
        const lines = doc.splitTextToSize(line, colWidth);
        doc.setFontSize(8);
        doc.setTextColor(...FIELD_LABEL_COLOR);
        doc.text(label, x, y + 3);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(value, x, y + 3 + LINE_HEIGHT);
        rowHeight = Math.max(rowHeight, LINE_HEIGHT * 2 + 2);
      }
      y += rowHeight + 2;
    }
    return y + SECTION_MARGIN;
  }

  const colWidth = (CONTENT_WIDTH - (cols - 1) * COL_GAP) / cols;

  for (let i = 0; i < entries.length; i += cols) {
    if (y + FIELD_ROW_HEIGHT > CONTENT_END) {
      doc.addPage();
      y = CONTENT_START;
    }
    const rowEntries = entries.slice(i, i + cols);
    let rowHeight = 0;

    for (let c = 0; c < rowEntries.length; c++) {
      const [label, value] = rowEntries[c];
      const x = MARGIN + c * (colWidth + COL_GAP);
      const cellY = y;

      doc.setFontSize(8);
      doc.setTextColor(...FIELD_LABEL_COLOR);
      doc.text(label, x, cellY + 3);
      doc.setTextColor(0, 0, 0);

      const valueBoxTop = cellY + 4;
      const valueInnerW = colWidth - 2 * FIELD_PADDING;
      const valueLines = doc.splitTextToSize(value, valueInnerW);
      const maxLines = cols === 1 ? 6 : 2;
      const lineCount = Math.min(valueLines.length, maxLines);
      const valueBoxHeight = Math.max(8, lineCount * LINE_HEIGHT + 2);
      const valueBoxWidth = colWidth;

      doc.setFillColor(...FIELD_BG);
      doc.setDrawColor(...FIELD_BORDER);
      doc.setLineWidth(0.2);
      doc.rect(x, valueBoxTop, valueBoxWidth, valueBoxHeight, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const textY = valueBoxTop + FIELD_PADDING + 3;
      for (let L = 0; L < lineCount; L++) {
        doc.text(valueLines[L], x + FIELD_PADDING, textY + L * LINE_HEIGHT);
      }
      rowHeight = Math.max(rowHeight, valueBoxHeight + 6);
    }
    y += rowHeight + 2;
  }
  return y + SECTION_MARGIN;
}

function addTable(doc: jsPDF, currentY: number, title: string, headers: string[], rows: string[][]): number {
  let y = currentY;
  if (y > CONTENT_END - 20) {
    doc.addPage();
    y = CONTENT_START;
  }
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text(title, MARGIN, y + LINE_HEIGHT);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE);

  const tableBody = rows.length > 0 ? rows : [['—']];
  const startY = y + LINE_HEIGHT + 2;
  const tableOpts = {
    startY,
    head: [headers],
    body: tableBody,
    margin: { left: MARGIN },
    theme: 'grid' as const,
    styles: { fontSize: 8 },
    headStyles: { fillColor: TABLE_HEAD_BG, textColor: TABLE_HEAD_TEXT, fontStyle: 'bold' as const },
  };
  try {
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(tableOpts);
    } else if (typeof autoTableFn === 'function') {
      autoTableFn(doc, tableOpts);
    } else {
      doc.text(title, MARGIN, startY);
      return y + 15;
    }
  } catch (e) {
    doc.text(title + ' (erreur affichage tableau)', MARGIN, startY);
    return y + 15;
  }
  const lastTable = (doc as any).lastAutoTable;
  return lastTable?.finalY != null ? lastTable.finalY + SECTION_MARGIN : y + 20;
}

/** Métadonnées optionnelles pour la section "Informations de base" (ex. depuis l’admin). */
export type ClientFormPdfMeta = {
  formType?: string;
  submittedAt?: string;
  status?: string;
  updatedAt?: string;
  completedAt?: string;
};

export type BuildClientFormPdfOptions = { preview?: boolean; meta?: ClientFormPdfMeta };

function formatMetaDate(s: string | undefined): string {
  if (!s) return '—';
  try {
    const date = new Date(s);
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function formatStatus(status: string | undefined, locale: 'fr' | 'en'): string {
  if (!status) return '—';
  const map: Record<string, { fr: string; en: string }> = {
    pending: { fr: 'En attente', en: 'Pending' },
    in_progress: { fr: 'En cours', en: 'In progress' },
    completed: { fr: 'Complété', en: 'Completed' },
    expired: { fr: 'Expiré', en: 'Expired' },
  };
  const t = map[status] || { fr: status, en: status };
  return locale === 'fr' ? t.fr : t.en;
}

/** Section Informations de base : label + valeur, état en couleur, type de formulaire surligné jaune, pastilles. */
function addBasicInfoSection(
  doc: jsPDF,
  y: number,
  locale: 'fr' | 'en',
  data: {
    fullName: string;
    phone: string;
    email: string;
    formTypeDisplay: string;
    submittedAt: string;
    statusText: string;
    statusKey?: string;
    lastModified: string;
  }
): number {
  if (y > CONTENT_END) {
    doc.addPage();
    y = CONTENT_START;
  }
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SECTION_TITLE_COLOR);
  doc.text(locale === 'fr' ? 'Informations de base' : 'Basic information', MARGIN, y + LINE_HEIGHT);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  y += LINE_HEIGHT + 4;

  const colWidth = (CONTENT_WIDTH - COL_GAP) / 2;
  const rows: { label: string; value: string; type: 'default' | 'formType' | 'status' }[] = [
    { label: locale === 'fr' ? 'Nom complet' : 'Full name', value: data.fullName, type: 'default' },
    { label: locale === 'fr' ? 'Téléphone' : 'Phone', value: data.phone, type: 'default' },
    { label: locale === 'fr' ? 'Courriel' : 'Email', value: data.email, type: 'default' },
    { label: locale === 'fr' ? 'Type de formulaire' : 'Form type', value: data.formTypeDisplay, type: 'formType' },
    { label: locale === 'fr' ? "Date d'envoi" : 'Sent date', value: data.submittedAt, type: 'default' },
    { label: locale === 'fr' ? 'État' : 'Status', value: data.statusText, type: 'status' },
    { label: locale === 'fr' ? 'Date de la dernière modification' : 'Last modified date', value: data.lastModified, type: 'default' },
  ];

  for (let i = 0; i < rows.length; i += 2) {
    if (y + LINE_HEIGHT * 2.5 > CONTENT_END) {
      doc.addPage();
      y = CONTENT_START;
    }
    const rowHeight = LINE_HEIGHT * 2 + 2;
    for (let c = 0; c < 2 && i + c < rows.length; c++) {
      const row = rows[i + c];
      const x = MARGIN + c * (colWidth + COL_GAP);
      const valueY = y + 3 + LINE_HEIGHT;

      doc.setFontSize(8);
      doc.setTextColor(...FIELD_LABEL_COLOR);
      doc.text(row.label, x, y + 3);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const iconGap = 2;
      let valueX = x;

      if (row.type === 'formType') {
        const textW = Math.min(doc.getTextWidth(row.value) + 4, colWidth - 2);
        doc.setFillColor(...HIGHLIGHT_YELLOW);
        doc.rect(x, valueY - 3.5, textW, 5, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text(row.value, x, valueY);
      } else if (row.type === 'status' && data.statusKey) {
        const statusColor = STATUS_COLORS[data.statusKey] ?? [80, 80, 80];
        doc.setFillColor(...statusColor);
        doc.circle(x + 1.2, valueY - 0.8, 1, 'F');
        valueX = x + 3.5;
        doc.setTextColor(...statusColor);
        doc.text(row.value, valueX, valueY);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.setFillColor(...FIELD_LABEL_COLOR);
        doc.circle(x + 1, valueY - 0.8, 0.7, 'F');
        valueX = x + 2.8;
        doc.text(row.value, valueX, valueY);
      }
    }
    y += rowHeight + 2;
  }
  return y + SECTION_MARGIN;
}

export async function buildClientFormPdf(
  formData: FormData,
  locale: 'fr' | 'en' = 'fr',
  options?: BuildClientFormPdfOptions
): Promise<void> {
  try {
    const logoDataUrl = await fetchLogoDataUrl();
    const meta = options?.meta;
    const d = formData != null && typeof formData === 'object' ? formData : {};
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica');
    doc.setFontSize(FONT_SIZE);
    let currentY = CONTENT_START;

  // ——— Informations de base (première page) ———
  const fullName = [val(d.lastName), val(d.firstName)].filter((x) => x !== '—').join(' ') || '—';
  const phone = val(d.phone ?? d.telephone ?? d.applicant?.phone);
  const email = val(d.applicant?.email ?? d.email);
  const formTypeDisplay = meta?.formType ?? (locale === 'fr' ? 'Formulaire client' : 'Client form');
  currentY = addBasicInfoSection(doc, currentY, locale, {
    fullName,
    phone,
    email,
    formTypeDisplay,
    submittedAt: formatMetaDate(meta?.submittedAt),
    statusText: formatStatus(meta?.status, locale),
    statusKey: meta?.status,
    lastModified: formatMetaDate(meta?.updatedAt ?? meta?.completedAt),
  });

  // ——— Étape 1 ——— (3 colonnes : champs courts)
  currentY = addSection(doc, currentY, locale === 'fr' ? '1. Détails de la demande et informations personnelles' : '1. Application details and personal information', [
    [locale === 'fr' ? 'Nombre de membres de famille' : 'Number of family members', val(d.numberOfFamilyMembers)],
    [locale === 'fr' ? 'Langue de correspondance' : 'Correspondence language', val(d.preferredLanguageCorrespondence)],
    [locale === 'fr' ? 'Langue d\'entrevue' : 'Interview language', val(d.preferredLanguageInterview)],
    [locale === 'fr' ? 'A un CSQ' : 'Has CSQ', translateYesNo(d.hasCSQ, locale)],
    ['CSQ number', val(d.csqNumber)],
    [locale === 'fr' ? 'Date demande CSQ' : 'CSQ application date', val(d.csqApplicationDate)],
    [locale === 'fr' ? 'Nom de famille' : 'Last name', val(d.lastName)],
    [locale === 'fr' ? 'Prénom' : 'First name', val(d.firstName)],
    ['UCI', val(d.uci)],
    [locale === 'fr' ? 'Sexe' : 'Sex', formatPdfValue('sex', d.sex, locale)],
    [locale === 'fr' ? 'Couleur des yeux' : 'Eye color', formatPdfValue('eyeColor', d.eyeColor, locale)],
    [locale === 'fr' ? 'Taille' : 'Height', formatPdfValue('height', d.height, locale)],
    [locale === 'fr' ? 'Date de naissance' : 'Date of birth', val(d.dateOfBirth)],
    [locale === 'fr' ? 'Lieu de naissance' : 'Place of birth', val(d.placeOfBirth)],
    [locale === 'fr' ? 'Pays de naissance' : 'Country of birth', val(d.countryOfBirth)],
  ], { cols: 3 });

  // ——— Étape 2 ——— (2 colonnes) : seulement les citoyennetés renseignées
  const citizenshipLabels = locale === 'fr' ? ['Citoyenneté 1', 'Citoyenneté 2', 'Citoyenneté 3', 'Citoyenneté 4', 'Citoyenneté 5'] : ['Citizenship 1', 'Citizenship 2', 'Citizenship 3', 'Citizenship 4', 'Citizenship 5'];
  const citizenshipValues = [d.citizenship1, d.citizenship2, d.citizenship3, d.citizenship4, d.citizenship5];
  const numCitizenships = Math.min(5, Math.max(0, parseInt(String(d.numberOfCitizenships || '0'), 10) || 0));
  const maritalStatus = (d.currentMaritalStatus ?? '').toString().toLowerCase();
  const showMarriageDate = maritalStatus === 'married' || maritalStatus === 'common-law';
  const section2Entries: [string, string][] = [
    [locale === 'fr' ? 'Nombre de citoyennetés' : 'Number of citizenships', val(d.numberOfCitizenships)],
    ...Array.from({ length: numCitizenships }, (_, i) => [citizenshipLabels[i], val(citizenshipValues[i])]),
    [locale === 'fr' ? 'Dernière entrée Canada' : 'Last entry Canada', val(d.lastEntryDate)],
    [locale === 'fr' ? 'Lieu dernière entrée' : 'Place last entry', val(d.lastEntryPlace)],
    [locale === 'fr' ? 'Résidence antérieure' : 'Previous residence', translateYesNo(d.hasPreviousResidence, locale)],
    [locale === 'fr' ? 'Détails résidence antérieure' : 'Previous residence details', val(d.previousResidenceDetails)],
    [locale === 'fr' ? 'État civil' : 'Marital status', translateMaritalStatus(d.currentMaritalStatus, locale)],
    ...(showMarriageDate ? [[locale === 'fr' ? 'Date mariage' : 'Marriage date', val(d.marriageDate)] as [string, string]] : []),
    [locale === 'fr' ? 'Conjoint nom' : 'Spouse last name', val(d.spouseLastName)],
    [locale === 'fr' ? 'Conjoint prénom' : 'Spouse first name', val(d.spouseFirstName)],
    [locale === 'fr' ? 'Ancien conjoint' : 'Previous spouse', translateYesNo(d.hasPreviousSpouse, locale)],
    [locale === 'fr' ? 'Adresse – App/Unité' : 'Address – Apt/Unit', val(d.apartmentUnit)],
    [locale === 'fr' ? 'Numéro de rue' : 'Street number', val(d.streetNumber)],
    [locale === 'fr' ? 'Nom de rue' : 'Street name', val(d.streetName)],
    [locale === 'fr' ? 'Ville' : 'City', val(d.city)],
    [locale === 'fr' ? 'Province' : 'Province', val(d.province)],
    [locale === 'fr' ? 'Pays' : 'Country', val(d.country)],
    [locale === 'fr' ? 'Code postal' : 'Postal code', val(d.postalCode)],
  ];
  currentY = addSection(doc, currentY, locale === 'fr' ? '2. Citoyenneté, résidence et état matrimonial' : '2. Citizenship, residence and marital status', section2Entries, { cols: 2 });

  // ——— Étape 3 ——— (2 colonnes)
  currentY = addSection(doc, currentY, locale === 'fr' ? '3. Passeport, pièce d\'identité et scolarité/emploi' : '3. Passport, identity document and education/employment', [
    [locale === 'fr' ? 'Numéro passeport' : 'Passport number', val(d.passportNumber)],
    [locale === 'fr' ? 'Pays délivrance passeport' : 'Passport issue country', val(d.passportIssueCountry)],
    [locale === 'fr' ? 'Date délivrance passeport' : 'Passport issue date', val(d.passportIssueDate)],
    [locale === 'fr' ? 'Date expiration passeport' : 'Passport expiry date', val(d.passportExpiryDate)],
    [locale === 'fr' ? 'Numéro pièce d\'identité' : 'National ID number', val(d.nationalIdNumber)],
    [locale === 'fr' ? 'Pays délivrance pièce' : 'National ID country', val(d.nationalIdIssueCountry)],
    [locale === 'fr' ? 'Niveau d\'études' : 'Education level', val(d.highestEducationLevel)],
    [locale === 'fr' ? 'Années d\'études' : 'Years of study', val(d.totalYearsOfStudy)],
    [locale === 'fr' ? 'Emploi actuel' : 'Current employment', val(d.currentEmployment)],
    [locale === 'fr' ? 'Emploi prévu' : 'Planned employment', val(d.plannedEmployment)],
  ], { cols: 2 });

  // ——— Étape 4 + tableau scolarité ——— (2 colonnes)
  currentY = addSection(doc, currentY, locale === 'fr' ? '4. Scolarité détaillée' : '4. Detailed education', [
    [locale === 'fr' ? 'Années primaire' : 'Elementary years', val(d.elementaryYears)],
    [locale === 'fr' ? 'Années secondaire' : 'Secondary years', val(d.secondaryYears)],
    [locale === 'fr' ? 'Années université' : 'University years', val(d.universityYears)],
    [locale === 'fr' ? 'Années formation professionnelle' : 'Vocational years', val(d.vocationalYears)],
  ], { cols: 2 });
  const educationHistory = Array.isArray(d.educationHistory) ? d.educationHistory : [];
  if (educationHistory.length > 0) {
    const eduRows = educationHistory.map((e: any) => [
      val(e.level),
      val(e.years),
      val(e.establishment),
      val(e.country),
    ]);
    currentY = addTable(
      doc,
      currentY,
      locale === 'fr' ? 'Historique scolarité' : 'Education history',
      locale === 'fr' ? ['Niveau', 'Années', 'Établissement', 'Pays'] : ['Level', 'Years', 'Establishment', 'Country'],
      eduRows
    );
  }

  // ——— Étape 5 – Historique adresses ———
  const addressHistory = Array.isArray(d.addressHistory) ? d.addressHistory : [];
  if (addressHistory.length > 0) {
    const addrRows = addressHistory.map((a: any) => [
      val(a.fromDate),
      val(a.toDate),
      val(a.streetAndNumber),
      val(a.city),
      val(a.province),
      val(a.postalCode),
      val(a.country),
    ]);
    currentY = addTable(
      doc,
      currentY,
      locale === 'fr' ? 'Historique des adresses' : 'Address history',
      locale === 'fr' ? ['Du', 'Au', 'Rue et numéro', 'Ville', 'Province', 'Code postal', 'Pays'] : ['From', 'To', 'Street', 'City', 'Province', 'Postal code', 'Country'],
      addrRows
    );
  }

  // ——— Étape 6 – Antécédents personnels ———
  const personalBackground = Array.isArray(d.personalBackground) ? d.personalBackground : [];
  if (personalBackground.length > 0) {
    const bgRows = personalBackground.map((p: any) => [
      val(p.fromDate),
      val(p.toDate),
      val(p.activity),
      val(p.location),
      val(p.details),
    ]);
    currentY = addTable(
      doc,
      currentY,
      locale === 'fr' ? 'Antécédents personnels' : 'Personal background',
      locale === 'fr' ? ['Du', 'Au', 'Activité', 'Lieu', 'Détails'] : ['From', 'To', 'Activity', 'Location', 'Details'],
      bgRows
    );
  }

  // ——— Étape 7 – Famille ———
  const section7Entries: [string, string][] = [];
  if (d.applicant) {
    section7Entries.push([locale === 'fr' ? 'Demandeur (nom)' : 'Applicant (name)', val(d.applicant.fullName || [d.applicant.lastName, d.applicant.firstName].filter(Boolean).join(' '))]);
    section7Entries.push([locale === 'fr' ? 'Demandeur – Date naissance' : 'Applicant DOB', val(d.applicant.dateOfBirth)]);
    section7Entries.push([locale === 'fr' ? 'Demandeur – Pays naissance' : 'Applicant country of birth', val(d.applicant.countryOfBirth)]);
    section7Entries.push([locale === 'fr' ? 'Demandeur – État civil' : 'Applicant marital status', val(d.applicant.maritalStatus)]);
    section7Entries.push([locale === 'fr' ? 'Demandeur – Courriel' : 'Applicant email', val(d.applicant.email)]);
    section7Entries.push([locale === 'fr' ? 'Demandeur – Adresse actuelle' : 'Applicant current address', val(d.applicant.currentAddress)]);
  }
  if (d.spouse) {
    section7Entries.push([locale === 'fr' ? 'Époux/Conjoint (nom)' : 'Spouse (name)', val(d.spouse.fullName || [d.spouse.lastName, d.spouse.firstName].filter(Boolean).join(' '))]);
    section7Entries.push([locale === 'fr' ? 'Époux – Date naissance' : 'Spouse DOB', val(d.spouse.dateOfBirth)]);
    section7Entries.push([locale === 'fr' ? 'Époux – Pays naissance' : 'Spouse country of birth', val(d.spouse.countryOfBirth)]);
  }
  if (d.mother) {
    section7Entries.push([locale === 'fr' ? 'Mère (nom)' : 'Mother (name)', val(d.mother.fullName || [d.mother.lastName, d.mother.firstName].filter(Boolean).join(' '))]);
    section7Entries.push([locale === 'fr' ? 'Mère – Date naissance' : 'Mother DOB', val(d.mother.dateOfBirth)]);
  }
  if (d.father) {
    section7Entries.push([locale === 'fr' ? 'Père (nom)' : 'Father (name)', val(d.father.fullName || [d.father.lastName, d.father.firstName].filter(Boolean).join(' '))]);
    section7Entries.push([locale === 'fr' ? 'Père – Date naissance' : 'Father DOB', val(d.father.dateOfBirth)]);
  }
  if (section7Entries.length > 0) {
    currentY = addSection(doc, currentY, locale === 'fr' ? '7. Famille (Demandeur, Époux, Mère, Père)' : '7. Family (Applicant, Spouse, Mother, Father)', section7Entries, { cols: 2 });
  }

  const children = Array.isArray(d.children) ? d.children : [];
  if (children.length > 0) {
    const childRows = children.map((c: any) => [
      val(c.fullName || [c.lastName, c.firstName].filter(Boolean).join(' ')),
      val(c.dateOfBirth),
      val(c.countryOfBirth),
      val(c.maritalStatus),
      val(c.email),
      val(c.currentAddress),
    ]);
    currentY = addTable(
      doc,
      currentY,
      locale === 'fr' ? 'Enfants' : 'Children',
      locale === 'fr' ? ['Nom', 'Date naissance', 'Pays naissance', 'État civil', 'Courriel', 'Adresse actuelle'] : ['Name', 'DOB', 'Country of birth', 'Marital status', 'Email', 'Current address'],
      childRows
    );
  }

  const siblings = Array.isArray(d.siblings) ? d.siblings : [];
  if (siblings.length > 0) {
    const sibRows = siblings.map((s: any) => [
      val(s.fullName || [s.lastName, s.firstName].filter(Boolean).join(' ')),
      val(s.dateOfBirth),
      val(s.countryOfBirth),
      val(s.maritalStatus),
      val(s.email),
      val(s.currentAddress),
    ]);
    currentY = addTable(
      doc,
      currentY,
      locale === 'fr' ? 'Frères et sœurs' : 'Siblings',
      locale === 'fr' ? ['Nom', 'Date naissance', 'Pays naissance', 'État civil', 'Courriel', 'Adresse actuelle'] : ['Name', 'DOB', 'Country of birth', 'Marital status', 'Email', 'Current address'],
      sibRows
    );
  }

  // ——— Étape 8 – Voyages ———
  currentY = addSection(doc, currentY, locale === 'fr' ? '8. Liste des voyages' : '8. List of travels', [
    [locale === 'fr' ? 'Aucun voyage' : 'No trips', translateYesNo(d.noTrips, locale)],
  ], { cols: 1 });
  const travels = Array.isArray(d.travels) ? d.travels : [];
  if (travels.length > 0) {
    const travelRows = travels.map((t: any) => [
      val(t.fromDate),
      val(t.toDate),
      val(t.duration),
      val(t.placeVisited),
      val(t.purpose),
      val(t.details),
    ]);
    currentY = addTable(
      doc,
      currentY,
      locale === 'fr' ? 'Voyages' : 'Travels',
      locale === 'fr' ? ['Du', 'Au', 'Durée', 'Lieu', 'Objectif', 'Détails'] : ['From', 'To', 'Duration', 'Place', 'Purpose', 'Details'],
      travelRows
    );
  }

  // ——— Étape 9 (ex step 10) – Questions de sécurité ———
  const qLabels: Record<string, string> = locale === 'fr'
    ? {
        questionA: 'Reconnu coupable d\'un crime au Canada (sans pardon)?',
        questionB: 'Coupable ou accusé/jugé pour crime ailleurs?',
        questionC: 'Demande d\'asile (Canada, autre pays, HCR)?',
        questionD: 'Refus statut réfugié / visa / résident permanent?',
        questionE: 'Refus d\'admission ou ordre de quitter?',
        questionF: 'Génocide, crime de guerre, crime contre humanité?',
        questionG: 'Lutte armée ou violence (objectifs politiques/religieux/sociaux)?',
        questionH: 'Associé à un groupe armé/violent?',
        questionI: 'Commis une infraction ou détenu?',
        questionJ: 'Détention, incarcération, prison?',
        questionK: 'Maladie grave ou désordre physique/mental?',
      }
    : {
        questionA: 'Convicted of crime in Canada (no pardon)?',
        questionB: 'Convicted or charged elsewhere?',
        questionC: 'Asylum application (Canada, other, UNHCR)?',
        questionD: 'Refused refugee status / visa / permanent resident?',
        questionE: 'Refused admission or order to leave?',
        questionF: 'Genocide, war crime, crime against humanity?',
        questionG: 'Armed struggle or violence (political/religious/social)?',
        questionH: 'Associated with armed/violent group?',
        questionI: 'Committed offence or detained?',
        questionJ: 'Detention, incarceration, prison?',
        questionK: 'Serious illness or physical/mental disorder?',
      };
  const securityEntries: [string, string][] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((letter) => {
    const key = `question${letter}`;
    return [qLabels[key] || key, translateYesNo(d[key], locale)];
  });
  securityEntries.push([locale === 'fr' ? 'Détails (si Oui)' : 'Details (if Yes)', val(d.securityDetails)]);
  securityEntries.push([locale === 'fr' ? 'Acceptation des conditions' : 'Agree to terms', translateYesNo(d.agreeToTerms, locale)]);
  currentY = addSection(doc, currentY, locale === 'fr' ? '9. Questions de sécurité' : '9. Security questions', securityEntries, { cols: 2 });

  // En-tête et pied de page sur chaque page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageHeader(doc, p, totalPages, logoDataUrl, locale);
    drawPageFooter(doc, p, totalPages, locale);
  }

  const fileName = locale === 'fr' ? 'formulaire-client-recap.pdf' : 'client-form-summary.pdf';
  if (options?.preview && typeof window !== 'undefined') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    doc.save(fileName);
  }
  } catch (err: any) {
    throw new Error(err?.message ?? 'Génération PDF impossible');
  }
}
