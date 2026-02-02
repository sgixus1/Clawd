
import React from 'react';
import { CompanySettings, ProjectStatus, Project, Milestone, MilestoneTemplate, Item } from './types';

export const GST_RATE = 0.09;

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  currency: 'SGD',
  dateFormat: 'DD/MM/YYYY',
  name: 'CRAFTED HABITAT',
  address: '55 UBI AVENUE 1, #07-01, SINGAPORE 408935',
  phone: '6931 1741',
  email: 'admin@craftedhabitat.sg',
  uen: '202339022H',
  website: 'https://craftedhabitat.sg',
  userName: 'RK Rajan',
  userTitle: 'Project Director',
  isGstRegistered: true,
  bankName: 'DBS Bank',
  bankAccount: '072-1089-670',
  remindLevyCpf: true,
  adminPin: '1920',
  adminPassword: '1920',
  hrPin: '1920',
  supervisorPin: '1234'
};

export const STANDARD_SITE_JOBS: Omit<Item, 'id'>[] = [
  // --- STRUCTURE WORKS ---
  { code: 'STR-01', category: 'STRUCTURE WORKS', description: 'BCA PERMIT APPROVAL', unit: 'LS', unitPrice: 3500 },
  { code: 'STR-02', category: 'STRUCTURE WORKS', description: 'SUPER STRUCTURE, CANOPY WORKS', unit: 'LS', unitPrice: 85000 },
  { code: 'STR-03', category: 'STRUCTURE WORKS', description: 'SWIMMING POOL CONSTRUCTION WORKS', unit: 'LS', unitPrice: 45000 },
  { code: 'STR-04', category: 'STRUCTURE WORKS', description: 'RC FOOTING & CONCRETING', unit: 'M3', unitPrice: 450 },
  { code: 'STR-05', category: 'STRUCTURE WORKS', description: 'RC TRENCH & STUDY ROOM SLAB', unit: 'LS', unitPrice: 12000 },
  
  // --- ARCHITECTURAL WORKS ---
  { code: 'ARC-01', category: 'ARCHITECTURAL WORKS', description: 'TIMBER DOOR 1ST FIX', unit: 'NOS', unitPrice: 150 },
  { code: 'ARC-02', category: 'ARCHITECTURAL WORKS', description: 'TIMBER DOOR 2ND FIX', unit: 'NOS', unitPrice: 350 },
  { code: 'ARC-03', category: 'ARCHITECTURAL WORKS', description: 'ALUM WINDOW / DOOR 1ST FIX', unit: 'LS', unitPrice: 4500 },
  { code: 'ARC-04', category: 'ARCHITECTURAL WORKS', description: 'ALUM WINDOW / DOOR 2ND FIX', unit: 'LS', unitPrice: 8500 },
  { code: 'ARC-05', category: 'ARCHITECTURAL WORKS', description: 'WATERPROOFING WORKS FOR BATHROOMS', unit: 'NOS', unitPrice: 450 },
  { code: 'ARC-06', category: 'ARCHITECTURAL WORKS', description: 'WALL TILING WORKS (INC. MATERIAL)', unit: 'SQFT', unitPrice: 12 },
  { code: 'ARC-07', category: 'ARCHITECTURAL WORKS', description: 'CEILING WORKS / PLASTERBOARD', unit: 'LS', unitPrice: 3200 },
  { code: 'ARC-08', category: 'ARCHITECTURAL WORKS', description: 'PAINTING WORKS (ENTIRE UNIT)', unit: 'LS', unitPrice: 2800 },
  
  // --- M & E WORKS ---
  { code: 'MNE-01', category: 'M & E WORKS', description: 'PLUMBING & SANITARY 1ST FIX', unit: 'LS', unitPrice: 2500 },
  { code: 'MNE-02', category: 'M & E WORKS', description: 'PLUMBING & SANITARY FINAL FIX', unit: 'LS', unitPrice: 1800 },
  { code: 'MNE-03', category: 'M & E WORKS', description: 'ELECTRICAL 1ST FIX (WIRING)', unit: 'LS', unitPrice: 4200 },
  { code: 'MNE-04', category: 'M & E WORKS', description: 'ELECTRICAL FINAL FIX (FITTINGS)', unit: 'LS', unitPrice: 1500 },
  { code: 'MNE-05', category: 'M & E WORKS', description: 'ACMV / AIR-CON INSTALLATION', unit: 'LS', unitPrice: 6500 },
  
  // --- EXTERNAL WORKS ---
  { code: 'EXT-01', category: 'EXTERNAL WORKS', description: 'FRONT BOUNDARY WALL & METER COMPARTMENT', unit: 'LS', unitPrice: 5500 },
  { code: 'EXT-02', category: 'EXTERNAL WORKS', description: 'MAIN GATES INSTALLATION', unit: 'NOS', unitPrice: 2200 },
  { code: 'EXT-03', category: 'EXTERNAL WORKS', description: 'CLEANING & CLEARING SITE', unit: 'LS', unitPrice: 850 }
];

export const MASTER_MILESTONE_CATALOG: MilestoneTemplate[] = [
  { id: 'g1', title: 'STRUCTURE WORKS', duration: 40, isGroup: true },
  { id: 'm1', parentId: 'g1', title: 'BCA PERMIT APPROVAL', duration: 10, isGroup: false },
  { id: 'm2', parentId: 'g1', title: 'SUPER STRUCTURE, CANOPY WORKS', duration: 30, isGroup: false },
  { id: 'm3', parentId: 'g1', title: 'SWIMMING POOL', duration: 30, isGroup: false },
  
  { id: 'g2', title: 'ARCHITECTURAL WORKS', duration: 46, isGroup: true },
  { id: 'm4', parentId: 'g2', title: 'TIMBER DOOR 1ST FIX', duration: 7, isGroup: false },
  { id: 'm5', parentId: 'g2', title: 'WALL TILING', duration: 10, isGroup: false },
  { id: 'm6', parentId: 'g2', title: 'CEILING WORKS', duration: 7, isGroup: false },
  { id: 'm7', parentId: 'g2', title: 'PAINTING WORKS', duration: 10, isGroup: false },
  
  { id: 'g3', title: 'M & E WORKS', duration: 55, isGroup: true },
  { id: 'm8', parentId: 'g3', title: 'PLUMBING & SANITARY WORKS', duration: 52, isGroup: false },
  { id: 'm9', parentId: 'g3', title: 'ELECTRICAL WORKS', duration: 46, isGroup: false },
  
  { id: 'g4', title: 'EXTERNAL WORKS', duration: 21, isGroup: true },
  { id: 'm10', parentId: 'g4', title: 'FRONT BOUNDARY WALL', duration: 7, isGroup: false },
  { id: 'm11', parentId: 'g4', title: 'CLEANING & CLEARING', duration: 1, isGroup: false },
  { id: 'm12', parentId: 'g4', title: 'HANDING OVER', duration: 1, isGroup: false }
];

export const SAMPLE_EXCLUSIONS = [
  "AUTHORITY FEES FOR 3-PHASE INCOMING POWER.",
  "AUTHORITY FEES FOR INCOMING WATER.",
  "AUTHORITY FEES FOR INCOMING NETLINK.",
  "AUTHORITY FEES FOR \"BCA\" \"URA\" AND OTHER GOVERNMENT FEES.",
  "ANY WORKS NOT STATED IN THE ABOVE QUOTATION WILL BE TREATED AS VARIATIONS.",
  "ARCHITECT AND PE FEES"
];

export const SAMPLE_TERMS = [
  "THIS QUOTATION HOLDS FIRM FOR ACCEPTANCE WITHIN '' 15 '' DAYS FROM DATE HEREOF .",
  "PRICES ARE BASE ON DRAWING & INFORMATION PROVIDED BY YOU & YOUR BILL OF QUANTITIES",
  "ANY CHANGES OR REQUEST FOR ALTERATION WILL BE SUBJECTED TO VARIATION IN PRICES.",
  "QUANTITIES SHALL BE BASED ON GROSS AREA AND ARE SUBJECTED TO SITE MEASUREMENT UPON COMPLETION.",
  "ANY SCOPE OF WORK NOT SPECIFIED IN THE CONTRACT SHALL BE TREATED AS A VARIATION ORDERS AND REASONABLE TIME SHALL BE GIVEN TO COMPLETE .",
  "PAYMENT TERMS :",
  "a) 10% UPON CONFIRMATION OF WORKS.",
  "b) 5% UPON COMMENCEMENT OF WORKS.",
  "c) 85% PROGRESS CLAIM.",
  "PROGRESS PAYMENT CLAIM WILL SUBMIT TO CLIENT ON 30 TH OF EACH MONTH",
  "CHEQUE SHOULD BE CROSSED AND PAYABLE TO ''CRAFTED HABITAT PTE LTD''",
  "THE TERMS OF PAYMENT SHALL BE 7 DAYS UPON THE TAX INVOICE SUBMITTED",
  "BANK TRANSFER DETAILS:",
  "BANK: DBS Bank",
  "ACCOUNT NUMBER: 072-1089-670",
  "CRAFTED HABITAT PTE LTD",
  "PAYNOW: 202339022H",
  "WE RESERVED THE RIGHT TO SUSPEND WORK IF PAYMENT DUE IS NOT PAID (07 DAYS UPON INVOICE SUBMITTED).",
  "ALL CLAIMS SUBMITTED ARE IN ACCORDANCE WITH SOP ACT"
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'SAMPLE PROJECT A&A',
    client: 'THE OWNER',
    location: 'PROJECT LOCATION',
    projectType: 'A&A WORKS',
    status: ProjectStatus.IN_PROGRESS,
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
    budget: 0,
    contractValue: 0,
    spent: 0,
    description: 'PROPOSED ADDITIONS AND ALTERATIONS WORKS',
    lastUpdated: Date.now(),
    materials: [],
    laborLogs: [],
    subcontractors: [],
    milestones: [],
    dailyUpdates: [],
    workers: [],
    clientPayments: []
  }
];
