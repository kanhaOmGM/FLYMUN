// ---------------------------------------------------------------------------
// Official FLY MUN Master Roster Dataset
// ---------------------------------------------------------------------------

import type { UserRole } from '../types';
import { isOrganiserRole } from '../types';

export const ALLOWED_ROLES: UserRole[] = ['Chair', 'Delegate', 'Faculty Advisor', 'Observer', 'Event Organiser', 'Admin'];

export const COMMITTEES = [
  'World Health Organization (WHO)',
  'International Press Corps (IPC)',
  'International Court of Justice (ICJ)',
] as const;

export type CommitteeName =
  | typeof COMMITTEES[number]
  | 'Unassigned'
  | 'N/A (Observer)'
  | 'N/A (Faculty Advisor)'
  | 'N/A (Event Organiser)'
  | 'N/A (Admin)'
  | 'Not Applicable';

export interface RawParticipant {
  name: string;
  email: string;
  role: UserRole;
  committee: string;
  model_country_assigned: string;
}

export const OFFICIAL_DATASET: RawParticipant[] = [
  {
    "name": "Abdulrahman Hafez Abd",
    "email": "cm.kaiwolfhard@gmail.com",
    "role": "Chair",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Madhukshara Nagarajan",
    "email": "madhuksharanagarajan276@gmail.com",
    "role": "Chair",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Ananya Rasal",
    "email": "rasalananya8@gmail.com",
    "role": "Chair",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Elamelek Çolak",
    "email": "kumsalelam25@gmail.com",
    "role": "Chair",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Chitrika Bohra",
    "email": "chitrikabohraa@gmail.com",
    "role": "Chair",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Kunsh Mathur",
    "email": "trucemun@gmail.com",
    "role": "Chair",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Taha Yavuz Karslıoğulları",
    "email": "tahayavuzkarsli9@gmail.com",
    "role": "Chair",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Doruk Özdemir",
    "email": "dorukozdemir333444@gmail.com",
    "role": "Chair",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Zahra Ali",
    "email": "z.a123412273@gmail.com",
    "role": "Chair",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Madhoolika M",
    "email": "mmadhoolika@gmail.com",
    "role": "Chair",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Zakiya Qureshi",
    "email": "zakiyaqureshi139@gmail.com",
    "role": "Chair",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Diyaa Lhaq Aaboud",
    "email": "diyaablink7@gmail.com",
    "role": "Chair",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Rashika Rao",
    "email": "rashikarao10@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Associated Press"
  },
  {
    "name": "Minha Wajahat",
    "email": "anaswajahat4@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Reuters"
  },
  {
    "name": "Sanchita Bhakat",
    "email": "sanchita1630@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "The Washington Post"
  },
  {
    "name": "Bipsa Dowari",
    "email": "dowariprianka@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "The Hindu"
  },
  {
    "name": "Rania Athira binti Mohd Rus",
    "email": "raniaathira09@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "The Straits Times"
  },
  {
    "name": "Maria Qadri",
    "email": "mariaqadri986@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Canada"
  },
  {
    "name": "Jana Farouk Salama",
    "email": "j4473448@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Türkiye"
  },
  {
    "name": "Narrottam Bhardwaj",
    "email": "narrottambhardwaj@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Sweden"
  },
  {
    "name": "Mustafa Nureldin",
    "email": "mustafa.nureddin@nos.edu.jo",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Bahamas"
  },
  {
    "name": "Bhavesh Kumar",
    "email": "singhbhaveshkumar553@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Georgia"
  },
  {
    "name": "Ananya Roy",
    "email": "ananyaroy533@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Switzerland"
  },
  {
    "name": "Irem Tokak",
    "email": "tokakirem@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Cyprus"
  },
  {
    "name": "Advika Roy",
    "email": "advika.roy07@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "United States of America"
  },
  {
    "name": "Hana Zekic",
    "email": "hanazekic3@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Israel"
  },
  {
    "name": "Aylin Naz",
    "email": "aylinnazkaya1308@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Czech Republic"
  },
  {
    "name": "Samar Saini",
    "email": "samarsaini230@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Spain"
  },
  {
    "name": "Zubeyr Batur",
    "email": "zubeyrbatur12@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Estonia"
  },
  {
    "name": "Syeda Ayla",
    "email": "aylaraza39@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Lebanon"
  },
  {
    "name": "Siddharth Rajpurohit",
    "email": "siddharthrajpurohit183@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Russian Federation"
  },
  {
    "name": "Ahmet Alp",
    "email": "alpefeozkan@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Japan"
  },
  {
    "name": "Alya Kılavuz",
    "email": "alyakilavuz@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Bulgaria"
  },
  {
    "name": "Ananya Jha",
    "email": "ananyajha244@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "India"
  },
  {
    "name": "Ksenia Charkina",
    "email": "kseniiacharkina25@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "France"
  },
  {
    "name": "Yara Mahmoud",
    "email": "yaramahmoud1108@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Germany"
  },
  {
    "name": "Duru Buse",
    "email": "durubusecinar@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Kazakhstan"
  },
  {
    "name": "Manya Sharma",
    "email": "manyasharma596@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "United Kingdom"
  },
  {
    "name": "Sultan Alhabsi",
    "email": "sultan.k.habsi@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Oman"
  },
  {
    "name": "Fatma Zehra",
    "email": "fatmazehrakoksal13@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Jordan"
  },
  {
    "name": "Ananya Sharma",
    "email": "ananya.sharma1910@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Norway"
  },
  {
    "name": "Ahmad Mustafa",
    "email": "ahmad.k.mustafa2010@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Saudi Arabia"
  },
  {
    "name": "Cemile Beren",
    "email": "cemileberenozdemir@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Armenia"
  },
  {
    "name": "Ece Naz",
    "email": "yalcinece949@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Egypt"
  },
  {
    "name": "Advaith Ananth",
    "email": "advaith.ananth@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Netherlands"
  },
  {
    "name": "Arshia Mishra",
    "email": "arshiamishra1109@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Spain"
  },
  {
    "name": "Görkem Çolak",
    "email": "gorkemcolak5@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "United States of America"
  },
  {
    "name": "Arya Vardhan",
    "email": "aryavardhangandhi@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "India"
  },
  {
    "name": "Ali Eren",
    "email": "alieren.yalcinn@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Bulgaria"
  },
  {
    "name": "Rayaan Baweja",
    "email": "rayaanbaweja123@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Norway"
  },
  {
    "name": "Amina Dervishi",
    "email": "amina.dervishi.2009@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Germany"
  },
  {
    "name": "Irem Su",
    "email": "iremsutuncel6@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "United Kingdom"
  },
  {
    "name": "Vaniya Batool",
    "email": "vaniyabatool10@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Australia"
  },
  {
    "name": "Ayşe Ebrar",
    "email": "ayseebrarkartal@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "France"
  },
  {
    "name": "Mustafa Tuna",
    "email": "mustafatunakocoglu@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Japan"
  },
  {
    "name": "Aylin Mina",
    "email": "aylinminakaya@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Greece"
  },
  {
    "name": "Luka Kvantaliani",
    "email": "kvantalianiluka10@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Poland"
  },
  {
    "name": "Ceren Duru",
    "email": "cerenduru.karakas@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Brazil"
  },
  {
    "name": "Aditya Singh",
    "email": "adityasingh2348@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Russian Federation"
  },
  {
    "name": "Ali Taha",
    "email": "alitaha.dilek@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Ukraine"
  },
  {
    "name": "Aaditya Vatsal",
    "email": "vatsalaaditya@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Al Jazeera"
  },
  {
    "name": "Arya Vardhan",
    "email": "aryavardhan.gandhi@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "CNN"
  },
  {
    "name": "Reyansh Mishra",
    "email": "reyanshmishra2012@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "BBC"
  },
  {
    "name": "Ananya S",
    "email": "ananyas.contact@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "The New York Times"
  },
  {
    "name": "Samar Singh",
    "email": "samarsingh.contact@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "The Guardian"
  },
  {
    "name": "Zaid Khan",
    "email": "zaidkhan.mun@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Advait Rao",
    "email": "advait.rao@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Devansh Gupta",
    "email": "devanshgupta.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Sneha Sen",
    "email": "snehasen.academic@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Pranav Nair",
    "email": "pranavnair.mun@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Tara Chawla",
    "email": "tarachawla@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Meera Iyer",
    "email": "meeraiyer.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Kabir Das",
    "email": "kabirdas.contact@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Anika Sen",
    "email": "anikasen@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Rohan Malhotra",
    "email": "rohanmalhotra.mun@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Kavya Menon",
    "email": "kavyamenon.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Tanmay Verma",
    "email": "tanmayverma@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Isha Joshi",
    "email": "ishajoshi.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Arjun Singhania",
    "email": "arjunsinghania.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Diya Pillai",
    "email": "diyapillai.mun@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Siddhesh Kulkarni",
    "email": "siddheshkulkarni@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Avani Deshmukh",
    "email": "avanideshmukh.mun@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Dhruv Kapoor",
    "email": "dhruvkapoor@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Rhea Chakraborty",
    "email": "rheachakraborty.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Varun Saxena",
    "email": "varunsaxena@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Nandini Bhatt",
    "email": "nandinibhatt.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Shaurya Mehra",
    "email": "shauryamehra@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Kritika Saini",
    "email": "kritikasaini.mun@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Daniela Cañas García de Movellán",
    "email": "danielamove09@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Stivan Slavchev",
    "email": "stivanslavchev011@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Meriem Benmansour",
    "email": "meryem64830@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Mohammad Ahmed",
    "email": "spy04805@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Daniella Achieng",
    "email": "niellaachieng46@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Taron Davtyan",
    "email": "stea22502@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Demi Espiritu",
    "email": "demiannespiritu26@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Angel Patel",
    "email": "patelangel5544@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Srishti Kashyap",
    "email": "srishtikashyap167@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Medina Akas",
    "email": "mediiiin1130@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Alisa Pchelnikova",
    "email": "elisapchelnikova@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Ceren Aydemir",
    "email": "cerenaydemir037@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Ela Gündoğan",
    "email": "elagundogan09@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Pelin Karataş",
    "email": "karataspelin10@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Melis Yılmaz",
    "email": "melisyilmaz.contact@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  }
];

export interface RosterEntry {
  id: string;
  name: string;
  role: UserRole;
  committee: string;
  country: string;
  email: string;
}

export const ROSTER_MASTER_DATA: RosterEntry[] = OFFICIAL_DATASET.map((r, index) => ({
  id: `roster-${index + 1}`,
  name: r.name,
  role: r.role,
  committee: r.committee,
  country: r.model_country_assigned,
  email: r.email.toLowerCase().trim(),
}));

/**
 * Find roster entry by email address.
 */
export function getRosterEntryByEmail(email: string): RosterEntry | undefined {
  if (!email) return undefined;
  const clean = email.toLowerCase().trim();
  return ROSTER_MASTER_DATA.find((r) => r.email === clean);
}

/**
 * Filter committees available for a given Role.
 */
export function getAvailableCommittees(role: UserRole | ''): string[] {
  if (!role) return [];
  if (role === 'Faculty Advisor') return ['N/A (Faculty Advisor)'];
  if (role === 'Observer') return ['Unassigned', 'N/A (Observer)'];
  if (isOrganiserRole(role)) return ['N/A (Event Organiser)'];
  
  const fromData = Array.from(
    new Set(
      ROSTER_MASTER_DATA.filter((r) => r.role === role && r.committee !== 'Unassigned').map((r) => r.committee)
    )
  );
  return fromData.length > 0 ? fromData : [...COMMITTEES];
}

/**
 * Filter countries available for a given Role and Committee.
 */
export function getAvailableCountries(role: UserRole | '', committee: string): string[] {
  if (!role || !committee) return [];
  if (role === 'Chair') return ['N/A (Chair)', 'Unassigned'];
  if (role === 'Faculty Advisor') return ['N/A (Faculty Advisor)'];
  if (role === 'Observer') return ['N/A (Observer)', 'Unassigned'];
  if (isOrganiserRole(role)) return ['N/A (Event Organiser)'];

  const matched = ROSTER_MASTER_DATA.filter(
    (entry) => entry.role === role && entry.committee === committee
  );
  const uniqueCountries = Array.from(new Set(matched.map((m) => m.country))).sort();
  return uniqueCountries.length > 0 ? uniqueCountries : ['Unassigned'];
}

/**
 * Filter names available for a selected Role + Committee + Country combination.
 */
export function getAvailableNames(role: UserRole | '', committee: string, country: string): string[] {
  if (!role || !committee || !country) return [];
  if (isOrganiserRole(role)) return [];
  const matches = ROSTER_MASTER_DATA.filter(
    (entry) =>
      entry.role === role &&
      entry.committee === committee &&
      (entry.country === country || country === 'N/A (Chair)' || country === 'N/A (Observer)' || country === 'Unassigned')
  );
  return matches.map((m) => m.name);
}
