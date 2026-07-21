export interface CharterRequirementView {
  id: string;
  requirement: string;
  whereToSecure: string;
  isSection: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface CharterStepView {
  id: string;
  step: string;
  action: string;
  fee: string;
  time: string;
  person: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CharterMedicineView {
  id: string;
  name: string;
  preparation: string;
  brand: string;
  price: string;
  isSection: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface CharterServiceView {
  id: string;
  name: string;
  pageNumber: number | null;
  description: string;
  officeOrDivision: string;
  classification: string;
  typeOfTransaction: string;
  whoMayAvail: string;
  details: string[];
  sortOrder: number;
  isActive: boolean;
  requirements: CharterRequirementView[];
  steps: CharterStepView[];
  medicines: CharterMedicineView[];
}

export interface CharterCategoryView {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  services: CharterServiceView[];
}

export interface CharterOfficeView {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  categories: CharterCategoryView[];
}

export interface CharterEditionView {
  id: string;
  title: string;
  year: number;
  editionLabel: string;
  description: string;
  pdfUrl: string;
  pdfFileName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  serviceCount: number;
  offices: CharterOfficeView[];
}
