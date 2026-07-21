export type CharterServiceType =
  | "External Services"
  | "Internal Services"
  | "Both External and Internal Services";

export interface CharterService {
  name: string;
  page: number;
  details?: string[];
}

export interface CharterServiceGroup {
  office: string;
  categories: {
    type: CharterServiceType;
    services: CharterService[];
  }[];
}

export const CITIZENS_CHARTER_PDF_URL = "/downloads/citizens-charter.pdf";

export const CITIZENS_CHARTER_SERVICE_GROUPS: CharterServiceGroup[] = [
  {
    office: "Bids and Awards Committee Office",
    categories: [
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Conduct Public Bidding for Infrastructure Projects", page: 12 },
          { name: "Procurement of Goods and Services", page: 25 },
          {
            name: "Conduct Public Bidding for Supply and Delivery of Consulting Services",
            page: 36,
          },
          {
            name: "Conduct Review on Purchase Requests and Determine Mode of Procurement",
            page: 48,
          },
        ],
      },
    ],
  },
  {
    office: "Catarman District Hospital",
    categories: [
      {
        type: "External Services",
        services: [
          { name: "Discharged Services for Inpatients", page: 56 },
          { name: "Dispensing of Medicines and/or Medical Supplies (Cash)", page: 59 },
          { name: "Emergency Services", page: 71 },
          { name: "Issuance of Certificate of Live Birth", page: 73 },
          { name: "Issuance of Death Certificate", page: 75 },
          {
            name: "Issuance of Medical Certificate for any purposes except legal matters",
            page: 77,
          },
          { name: "Issuance of Medico-legal Certificate", page: 79 },
          { name: "Laboratory Test Examination Services for Inpatient", page: 81 },
          { name: "Laboratory Test Examination Services for Outpatient", page: 83 },
          {
            name: "Medical Assistance for Indigent and Financially Incapacitated Patients (MAIFIP) – Inpatient",
            page: 85,
          },
          {
            name: "Medical Assistance for Indigent and Financially Incapacitated Patients (MAIFIP) – Outpatient",
            page: 87,
          },
          { name: "Outpatient Consultation and Treatment", page: 89 },
        ],
      },
    ],
  },
  {
    office: "Office of the Provincial Administrator",
    categories: [
      {
        type: "Internal Services",
        services: [{ name: "Application for Leave", page: 92 }],
      },
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Issuance of Certificate of Employment and Service Record", page: 97 },
          { name: "Recruitment, Selection, and Placement", page: 99 },
        ],
      },
    ],
  },
  {
    office: "Office of the Provincial Vice Governor / Sangguniang Panlalawigan",
    categories: [
      {
        type: "External Services",
        services: [
          { name: "Request for Accreditation of Civil Society Organizations (CSOs)", page: 115 },
          { name: "Request for the Validity of Appropriation Ordinances", page: 117 },
          { name: "Request for the Validity of Municipal Ordinances", page: 119 },
        ],
      },
      {
        type: "Internal Services",
        services: [{ name: "Request for the Enactment of Ordinances", page: 122 }],
      },
      {
        type: "Both External and Internal Services",
        services: [
          {
            name: "Provision of Resolutions, Ordinances, and other Legislative Records",
            page: 125,
          },
          { name: "Request for Adoption of Resolutions", page: 127 },
        ],
      },
    ],
  },
  {
    office: "Provincial Accounting Department",
    categories: [
      {
        type: "Internal Services",
        services: [
          { name: "Payment of Services for Contract-of-Service (COS) Workers", page: 129 },
          { name: "Payroll Services for Job Order (JO) Workers", page: 135 },
          { name: "Payroll Services for Regular Employees", page: 142 },
        ],
      },
    ],
  },
  {
    office: "Provincial Agriculture Department",
    categories: [
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Availment of Assorted Seedlings", page: 150 },
          { name: "Availment of Solar Drying Facility", page: 152 },
          { name: "Request for Assorted Planting Materials", page: 154 },
          { name: "Request for Available Agricultural Data", page: 156 },
          { name: "Request for Information Education Campaign (IEC) Materials", page: 158 },
          { name: "Technical and Agricultural Extension Services", page: 160 },
        ],
      },
    ],
  },
  {
    office: "Provincial Assessments Department",
    categories: [
      {
        type: "External Services",
        services: [
          {
            name: "Issuance of Certificate of Property Holdings, Certified True Copy of Tax Declaration, and Improvement/No-Improvement",
            page: 163,
          },
          { name: "Issuance of Certificate of Real Property Historical Ownership", page: 166 },
          {
            name: "Issuance of New Tax Declaration for Newly Discovered Property (Land, Building, and Machineries)",
            page: 169,
          },
          {
            name: "Issuance of Tax Declaration with Annotation/Cancellation of Mortgage, Bail Bond and Other Encumbrances",
            page: 172,
          },
          {
            name: "Issuance of New Tax Declaration for Revision, such as Consolidation/Subdivision and/or Re-Classification",
            page: 174,
          },
        ],
      },
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Issuance of New Tax Declaration for Transfer of Ownership", page: 178 },
          { name: "Request for Appraisal of Land and Buildings", page: 181 },
        ],
      },
    ],
  },
  {
    office: "Provincial Disaster Risk Reduction and Management Office",
    categories: [
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Request for Conduct of Capacity Building Training", page: 184 },
          { name: "Request for Augmentation or Deployment of Personnel during Activities", page: 186 },
          {
            name: "Request for Dredging of Canals, Rivers or other Waterways and/or Cutting/Pruning of Hazardous Trees",
            page: 188,
          },
        ],
      },
    ],
  },
  {
    office: "Provincial Engineering Department",
    categories: [
      {
        type: "External Services",
        services: [
          { name: "Heavy Equipment Rental Service", page: 191 },
          { name: "Request for Payment (Contract Projects)", page: 195 },
          { name: "Request for Plans and Program of Works for Government Structures", page: 203 },
          { name: "Request for Plans and Program of Works for Road Projects", page: 206 },
          { name: "Request for Rehabilitation of Roads", page: 209 },
          { name: "Request for Rehabilitation of Government Structures", page: 211 },
          { name: "Request for Release of Retention Fee (Contract Projects)", page: 214 },
        ],
      },
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Issuance of Road-Right-of-Way Clearance and Cutting Permit", page: 220 },
        ],
      },
    ],
  },
  {
    office: "Provincial Environment and Natural Resources Department",
    categories: [
      {
        type: "External Services",
        services: [
          { name: "Application of Quarry Permits", page: 224 },
          { name: "Issuance of Extraction and Hauling Permit", page: 229 },
          { name: "Issuance of Tipping Fee for the Camiguin Sanitary Landfill", page: 232 },
        ],
      },
    ],
  },
  {
    office: "Provincial General Services Department",
    categories: [
      {
        type: "External Services",
        services: [
          { name: "Issuance of Fuel", page: 235 },
          { name: "Request to Use Equipment and Facilities", page: 237 },
          { name: "Payment of Goods and Services", page: 239 },
          { name: "Receiving and Commitment of Persons Deprived of Liberty (PDL)", page: 248 },
          { name: "Releasing of Persons Deprived of Liberty", page: 250 },
        ],
      },
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Issuance of Certificate of Detention to Walk-In Client", page: 253 },
        ],
      },
    ],
  },
  {
    office: "Provincial Health Department",
    categories: [
      {
        type: "Both External and Internal Services",
        services: [
          {
            name: "Availment of Medicines for Medical Assistance to Indigent and Financially Incapacitated Patients (MAIFIP) Program",
            page: 257,
          },
          { name: "Issuance of Medical Certificate", page: 259 },
        ],
      },
    ],
  },
  {
    office: "Provincial Information and Communication Office",
    categories: [
      {
        type: "Internal Services",
        services: [
          { name: "Documentary Video Releases", page: 262 },
          { name: "Media Coverage and Documentation of Events and Meetings", page: 264 },
          { name: "Posting of Announcements of Events and Public Advisories", page: 266 },
        ],
      },
    ],
  },
  {
    office: "Provincial Legal Department",
    categories: [
      {
        type: "Both External and Internal Services",
        services: [
          { name: "Legal Counseling Services", page: 269 },
          {
            name: "Request for Affidavits and Legal Documents (Simple and Non-Adversarial, and Complicated and Adversarial)",
            page: 271,
          },
        ],
      },
    ],
  },
  {
    office: "Provincial Planning and Development Department",
    categories: [
      {
        type: "Both External and Internal Services",
        services: [
          {
            name: "Request for a Soft Copy of Provincial Development and Physical Framework Plan (PDPFP)",
            page: 274,
          },
          {
            name: "Request for a Soft/Hard Copy (JPEG format) of Available Provincial Maps and Other GIS-Based Services",
            page: 276,
          },
        ],
      },
    ],
  },
  {
    office: "Provincial Social Welfare and Development Department",
    categories: [
      {
        type: "External Services",
        services: [
          {
            name: "Aid to Individuals in Crisis Situation (AICS)",
            page: 279,
            details: [
              "Balik Probinsya Assistance",
              "Burial Assistance",
              "Cash Assistance",
              "Educational Assistance",
              "Food Assistance",
              "Medical Assistance",
              "Transportation Assistance",
            ],
          },
          { name: "Emergency Shelter / Shelter Assistance", page: 290 },
          { name: "Medicine Assistance", page: 296 },
        ],
      },
    ],
  },
  {
    office: "Provincial Tourism Department",
    categories: [
      {
        type: "External Services",
        services: [
          {
            name: "Issuance of Local Accreditation Certificate for Tourism Related Establishment",
            page: 299,
          },
          { name: "Request for Basic Tourism Related Information", page: 302 },
          {
            name: "Request for Pre-Inspection for Local Accreditation of Tourism Related Establishment",
            page: 305,
          },
        ],
      },
    ],
  },
  {
    office: "Provincial Treasury Department",
    categories: [
      {
        type: "External Services",
        services: [
          { name: "Payment Services on Printing & Publication and Franchise Tax", page: 308 },
          { name: "Payment Services on Professional Tax", page: 310 },
          { name: "Payment Services on Tax on Delivery Van and Truck", page: 311 },
        ],
      },
    ],
  },
  {
    office: "Provincial Veterinary Department",
    categories: [
      {
        type: "External Services",
        services: [
          {
            name: "Animal Breeding Services (Artificial Insemination – Cattle, Carabao, Goat and Swine)",
            page: 314,
          },
          { name: "Animal Health Services – Field", page: 316 },
          { name: "Animal Health Services – Walk-in", page: 319 },
          { name: "Animal Minor Surgery Services – Field", page: 323 },
          { name: "Animal Surgery Services – Walk-in", page: 326 },
          { name: "Availment of Farm Produce – 30 Sow-Level Techno-Demo Farm", page: 329 },
          { name: "Availment of Farm Produce – Free Range Chicken Multiplier Farm", page: 331 },
          { name: "Dog and Cat Vaccination Services", page: 333 },
          { name: "Fresh Milk Availment – Walk-In", page: 335 },
          {
            name: "Issuance of Governor’s Permit for Incoming Animals, Animal Products, and By-Products",
            page: 337,
          },
          { name: "Issuance of Hog Transport Permit (HTP)", page: 339 },
          { name: "Issuance of Veterinary Health Certificates", page: 341 },
          { name: "Livelihood Assistance through Animal Breeding Stocks Dispersal", page: 344 },
          { name: "Request for Clearance for Slaughter", page: 346 },
          { name: "Request for Redemption of Confiscated Animal Commodity", page: 348 },
        ],
      },
    ],
  },
  {
    office: "Public Employment Service Office",
    categories: [
      {
        type: "External Services",
        services: [
          {
            name: "Application for Free Review Programs: Civil Service Examination (CSE), Licensure Examination for Teachers (LET), and Agriculturists Licensure Examination (ALE)",
            page: 351,
          },
          {
            name: "Application for Scholarship Programs: Camiguin Doktor sa Probinsya and Camiguin Scholar sa Probinsya",
            page: 353,
          },
          { name: "Application for Special Program for Employment of Students (SPES)", page: 356 },
        ],
      },
    ],
  },
  {
    office: "Tourism Facilities Management Group",
    categories: [
      {
        type: "External Services",
        services: [
          {
            name: "Issuance of Lease Contract of the Provincial Government Tourism Facilities (New Applicant)",
            page: 359,
          },
          {
            name: "Issuance of Contract of Lease of the Provincial Government Tourism Facilities (Renewal)",
            page: 364,
          },
        ],
      },
    ],
  },
];

export const CITIZENS_CHARTER_SERVICE_COUNT = CITIZENS_CHARTER_SERVICE_GROUPS.reduce(
  (total, group) =>
    total +
    group.categories.reduce((categoryTotal, category) => categoryTotal + category.services.length, 0),
  0
);
