// ---------------------------------------------------------------------------
// Official FLYIMUN 2026 Master Roster Dataset (101 Participants)
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
    "name": "Pratik Patni",
    "email": "pratikpatni194s@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Netherlands"
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
    "name": "noor fatima",
    "email": "noorayfatima196@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Voice of America (VOA)"
  },
  {
    "name": "khushi gupta",
    "email": "tanya.gupta.2011.09@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Egypt"
  },
  {
    "name": "Aashvi jindal",
    "email": "aashvu0101@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Switzerland"
  },
  {
    "name": "Aarya Singh",
    "email": "aaryaa.s.mail@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "France"
  },
  {
    "name": "yuvika chopra",
    "email": "choprayuvika@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Bahamas"
  },
  {
    "name": "Aayisha Sathar",
    "email": "aayishasathar.2022@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "The Nation"
  },
  {
    "name": "Ali Saker",
    "email": "ali.saker2009@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Channels Television"
  },
  {
    "name": "Falak Naz",
    "email": "fnaz9148@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Czech Republic"
  },
  {
    "name": "Akanksha Janke",
    "email": "akankshajanke@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Denmark"
  },
  {
    "name": "Shivam Jha",
    "email": "shrutvikjha@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Milenio"
  },
  {
    "name": "Dhara Arora",
    "email": "dhaaaaraaaa08@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "SBS News"
  },
  {
    "name": "Kunal Raj Holkar",
    "email": "aarushiraj178@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Bangladesh"
  },
  {
    "name": "Jivanshi madan",
    "email": "jivanshimadan11@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "DPR Korea"
  },
  {
    "name": "hifza hassan",
    "email": "hifzahasan2011@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Bulgaria"
  },
  {
    "name": "Varun Kandpal",
    "email": "varunkandpal236@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "ANTARA"
  },
  {
    "name": "Saif ullah",
    "email": "saifcom098123@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Ethiopia"
  },
  {
    "name": "Eshaan Siddiqui",
    "email": "webweve2026@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Algeria"
  },
  {
    "name": "Fatima ghulamullah",
    "email": "fatimaghulamullah6@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Australia"
  },
  {
    "name": "Maanyag Vasquez",
    "email": "maanyaghv@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Algeria"
  },
  {
    "name": "Shreyaas .S",
    "email": "shreyaas203@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Denmark"
  },
  {
    "name": "Lisha S Liju",
    "email": "lishalijushailveena@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Canada"
  },
  {
    "name": "Momina ahmad",
    "email": "mominaahmad60@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Arirang TV"
  },
  {
    "name": "Ezel Dülger",
    "email": "ezeldulger1@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Agência Brasil"
  },
  {
    "name": "Keeya Roy Paul",
    "email": "keeya.roypaul999@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "NHK World"
  },
  {
    "name": "Sameer Ali",
    "email": "sameer.ali161782@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "DD News"
  },
  {
    "name": "Anna Klimova",
    "email": "677753355as@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "CGTN"
  },
  {
    "name": "Muhammad Arhum Shafique",
    "email": "arhummuhammad924@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Dawn News"
  },
  {
    "name": "Gleb Myroshnyk",
    "email": "pugerfaver@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "CBC News"
  },
  {
    "name": "Aditya Verma",
    "email": "moonanshul@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Kiribati"
  },
  {
    "name": "Alina Rizvi",
    "email": "alinarizvi626@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Brazil"
  },
  {
    "name": "Seerat Zainab",
    "email": "seerat.zainab.2011@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Indonesia"
  },
  {
    "name": "Momin Khan",
    "email": "sardarmominkhan8@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "China"
  },
  {
    "name": "Muhammad Usman",
    "email": "mianu4431@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Al Jazeera"
  },
  {
    "name": "Rimsha Suhel",
    "email": "rimshas2907@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "SABC News"
  },
  {
    "name": "Mahi Dwivedi",
    "email": "mohiisus2@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Italy"
  },
  {
    "name": "Maitreyi Bhardwaj",
    "email": "maitreyi12515@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "France"
  },
  {
    "name": "Semih Akgün",
    "email": "akgunsemih1615@gmail.com",
    "role": "Delegate",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Kaushiki Gupta",
    "email": "kaush009gupta@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Australia"
  },
  {
    "name": "Emiliano Espinoza Diaz",
    "email": "emiliano.espinoza.d2010@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Germany"
  },
  {
    "name": "Dan Mark Balocos",
    "email": "balocosdanmark@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Japan"
  },
  {
    "name": "Muhammad Azan",
    "email": "azanarshad779@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Brazil"
  },
  {
    "name": "Ayesha Tahir",
    "email": "ayeshatahir3011@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Indonesia"
  },
  {
    "name": "Rukaia Sameh",
    "email": "cfemena1@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "BBC World Service"
  },
  {
    "name": "Kris Ann Shelly",
    "email": "kroissantshells@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "India"
  },
  {
    "name": "Nynieshia Alex",
    "email": "nynieshiaalex@gmail.com",
    "role": "Chair",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Ayesha Salman",
    "email": "ayeshasalman013@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "TRT World"
  },
  {
    "name": "Ansh Patel",
    "email": "anshp8281@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "India"
  },
  {
    "name": "Gorav Singh Chhillar",
    "email": "goravschhillar@gmail.com",
    "role": "Delegate",
    "committee": "International Press Corps (IPC)",
    "model_country_assigned": "Deutsche Welle"
  },
  {
    "name": "Anushka Na",
    "email": "anushka432009@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Tuvalu"
  },
  {
    "name": "Hala Nassar",
    "email": "hodihi2225@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "United States"
  },
  {
    "name": "Pranit Poddar",
    "email": "pranitpoddar2408@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "United Kingdom"
  },
  {
    "name": "Maarij Mahmood khan",
    "email": "marimahmood27@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Maldives"
  },
  {
    "name": "Rabnoor Singh",
    "email": "nunu565690@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Nigeria"
  },
  {
    "name": "Fareeha Azhar",
    "email": "fareehaazhar786@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "South Africa"
  },
  {
    "name": "Defne Çubuk",
    "email": "defnecubuk@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "China"
  },
  {
    "name": "Dania Nasir",
    "email": "danianasir151@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Russian Federation"
  },
  {
    "name": "Giribha Bhatt",
    "email": "giribhaab@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Switzerland"
  },
  {
    "name": "Adn Fatima",
    "email": "adnfarooq315@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "United States"
  },
  {
    "name": "Amay Singh Kanwar",
    "email": "amaysinghkanwar@gmail.com",
    "role": "Delegate",
    "committee": "International Court of Justice (ICJ)",
    "model_country_assigned": "Marshall Islands"
  },
  {
    "name": "Abdul Rehman Tauqir Ahmad",
    "email": "ar1599672@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Singapore"
  },
  {
    "name": "Vishakha Sharma",
    "email": "vishakhash0000@gmail.com",
    "role": "Delegate",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Fatima (only Fatima)",
    "email": "fatimaahmedfaraz@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Japan"
  },
  {
    "name": "Ji Woo Kim",
    "email": "jwookim111310@student.interamericano.edu.gt",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "South Korea"
  },
  {
    "name": "Vanshika Verma",
    "email": "vanshikaaverma.11@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Türkiye"
  },
  {
    "name": "Saoda Binte Zahid",
    "email": "saodabintezahid@gmail.com",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "Germany"
  },
  {
    "name": "Joud Chehab",
    "email": "joudchehab@gokkusagi.k12.tr",
    "role": "Delegate",
    "committee": "World Health Organization (WHO)",
    "model_country_assigned": "United Kingdom"
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
    "name": "Polina Vasylenko",
    "email": "vasilenkopolik@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Vidi Riyanto",
    "email": "b.vanilla.d@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Vinutha .R",
    "email": "goldenhourchronicle@gmail.com",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Oumayma Aouaj",
    "email": "o.aouaj-324@ump.ac.ma",
    "role": "Observer",
    "committee": "Unassigned",
    "model_country_assigned": "Unassigned"
  },
  {
    "name": "Abir Hamrani",
    "email": "abirhamrani@gmail.com",
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
