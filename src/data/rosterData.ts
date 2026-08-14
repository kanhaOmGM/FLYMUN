// ---------------------------------------------------------------------------
// Official MyMUN Master Roster Dataset (With Emails)
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
  | 'N/A (Observer)'
  | 'N/A (Faculty Advisor)'
  | 'N/A (Event Organiser)'
  | 'N/A (Admin)'
  | 'Not Applicable';

export interface RawRosterEntry {
  Name: string;
  Role: UserRole;
  Committee: string;
  'Model Country': string;
  Email: string;
}

export const OFFICIAL_MYMUN_ROSTER: RawRosterEntry[] = [
  { "Name": "Ananya Rasal", "Role": "Chair", "Committee": "World Health Organization (WHO)", "Model Country": "N/A (Chair)", "Email": "rasalananya8@gmail.com" },
  { "Name": "Elamelek Çolak", "Role": "Chair", "Committee": "International Press Corps (IPC)", "Model Country": "N/A (Chair)", "Email": "kumsalelam25@gmail.com" },
  { "Name": "Chitrika Bohra", "Role": "Chair", "Committee": "International Press Corps (IPC)", "Model Country": "N/A (Chair)", "Email": "chitrikabohraa@gmail.com" },
  { "Name": "Kunsh Mathur", "Role": "Chair", "Committee": "International Press Corps (IPC)", "Model Country": "N/A (Chair)", "Email": "trucemun@gmail.com" },
  { "Name": "Taha Yavuz Karslıoğulları", "Role": "Chair", "Committee": "World Health Organization (WHO)", "Model Country": "N/A (Chair)", "Email": "tahayavuzkarsli9@gmail.com" },
  { "Name": "Doruk Özdemir", "Role": "Chair", "Committee": "International Court of Justice (ICJ)", "Model Country": "N/A (Chair)", "Email": "dorukozdemir333444@gmail.com" },
  { "Name": "Zahra Ali", "Role": "Chair", "Committee": "World Health Organization (WHO)", "Model Country": "N/A (Chair)", "Email": "z.a123412273@gmail.com" },
  { "Name": "Madhoolika M", "Role": "Chair", "Committee": "International Court of Justice (ICJ)", "Model Country": "N/A (Chair)", "Email": "mmadhoolika@gmail.com" },
  { "Name": "Zakiya Qureshi", "Role": "Chair", "Committee": "International Court of Justice (ICJ)", "Model Country": "N/A (Chair)", "Email": "zakiyaqureshi139@gmail.com" },
  { "Name": "Diyaa Lhaq Aaboud", "Role": "Chair", "Committee": "World Health Organization (WHO)", "Model Country": "N/A (Chair)", "Email": "diyaablink7@gmail.com" },
  { "Name": "Maria Qadri", "Role": "Delegate", "Committee": "International Court of Justice (ICJ)", "Model Country": "Canada", "Email": "mariaqadri986@gmail.com" },
  { "Name": "Jana Farouk Salama", "Role": "Delegate", "Committee": "International Court of Justice (ICJ)", "Model Country": "Türkiye", "Email": "j4473448@gmail.com" },
  { "Name": "Anishka Thote", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Nigeria", "Email": "anishkathote@gmail.com" },
  { "Name": "K.A.S. Bhasuru Basnayake", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Indonesia", "Email": "bhasurubasnayake1112@gmail.com" },
  { "Name": "A.D. Tishan Hansaja", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "South Korea", "Email": "tishanhansaja633@gmail.com" },
  { "Name": "Aavya Ritesh Patel", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Denmark", "Email": "patelaavya130@gmail.com" },
  { "Name": "M.G. Sadasa Damsikunu", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Canada", "Email": "damsikunusadasa@gmail.com" },
  { "Name": "khushi gupta", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Egypt", "Email": "k30gupta@gmail.com" },
  { "Name": "Aditya V L", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Russian Federation", "Email": "v.l.aditya38@gmail.com" },
  { "Name": "Arohi Pathak", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "South Africa", "Email": "arohipathak0112@gmail.com" },
  { "Name": "Syed Mohammad Ibrahim", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "The Nation", "Email": "syed.ibrahim.mun@gmail.com" },
  { "Name": "Shivangi Rai", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "DD News", "Email": "raishivangi024@gmail.com" },
  { "Name": "Sama Sharief", "Role": "Delegate", "Committee": "International Court of Justice (ICJ)", "Model Country": "China", "Email": "samasharief811@gmail.com" },
  { "Name": "Waniya Merchant", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Sweden", "Email": "merchantsuleman99@gmail.com" },
  { "Name": "Zainab Fatema", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "India", "Email": "zainabfatema472@gmail.com" },
  { "Name": "Siya Jatin Sheth", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Germany", "Email": "shethsiya2010@gmail.com" },
  { "Name": "Devanshi D", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "France", "Email": "vinsu10.d@gmail.com" },
  { "Name": "Pratiti V R", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Brazil", "Email": "pratitivr@gmail.com" },
  { "Name": "Ira R", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "United Kingdom", "Email": "iraar2812@gmail.com" },
  { "Name": "Rudra A R", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Reuters", "Email": "rudras3166@gmail.com" },
  { "Name": "Pranav Ram the great", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Australia", "Email": "amutha925@gmail.com" },
  { "Name": "Eren M. Kayran", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Switzerland", "Email": "erenkayran.mun@gmail.com" },
  { "Name": "P.M.S. Bhasura Jayarathna", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Tuvalu", "Email": "sandeepa.sl2008@gmail.com" },
  { "Name": "Vihaan Sharma", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Al Jazeera", "Email": "vijaymita@gmail.com" },
  { "Name": "Defne Çubuk", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "China", "Email": "defnecubuk2011@gmail.com" },
  { "Name": "N. Sasi Ranga", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Voice of America (VOA)", "Email": "sasiranga.nathan@gmail.com" },
  { "Name": "Saarang Sathish", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "BBC World Service", "Email": "saarangsathish@gmail.com" },
  { "Name": "Yagiz Efe Kilic", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "TRT World", "Email": "yagizefekilic44@gmail.com" },
  { "Name": "Efe Topal", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Channels Television", "Email": "topalefe379@gmail.com" },
  { "Name": "Hanzala Wani", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "DPR Korea", "Email": "wanisajad288@gmail.com" },
  { "Name": "Atakan Türkmen", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Milenio", "Email": "turkmenatakan17@gmail.com" },
  { "Name": "Cem Efe Onuk", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "ANTARA", "Email": "cemefe.onuk@icloud.com" },
  { "Name": "Muhammet Talha Polat", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Agência Brasil", "Email": "talhapolat190538@gmail.com" },
  { "Name": "Derin Dilaver", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "CGTN", "Email": "derin.dilaver@icloud.com" },
  { "Name": "Zehra Duman", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Arirang TV", "Email": "zehraduman010@gmail.com" },
  { "Name": "Eren Pektaş", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "SABC News", "Email": "erenpektas355@gmail.com" },
  { "Name": "Anshika Raghuvanshi", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Algeria", "Email": "anshika040108@gmail.com" },
  { "Name": "İsmail Hamza Temiz", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "France 24", "Email": "hamza.tmz28@gmail.com" },
  { "Name": "Mehmet Eren Kaynak", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Deutsche Welle", "Email": "kaynakmehmeteren@gmail.com" },
  { "Name": "Çağan Çorumlu", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "SBS News", "Email": "corumlucagan88@gmail.com" },
  { "Name": "Kevser Yılmaz", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "CBC News", "Email": "kevsyilmazz@gmail.com" },
  { "Name": "Mustafa Ömer Karaboğa", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "Dawn News", "Email": "mustafakrbg321@gmail.com" },
  { "Name": "Mustafa Tuna Sancak", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "United States", "Email": "tunasancak34@gmail.com" },
  { "Name": "Semih Akgün", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "ABC News", "Email": "akgunsemih1615@gmail.com" },
  { "Name": "Aditri Dave", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Kiribati", "Email": "aditridave11@gmail.com" },
  { "Name": "Shreya Gupta", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Maldives", "Email": "shreyaguptawork08@gmail.com" },
  { "Name": "Shanaya Agrawal", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Marshall Islands", "Email": "shanaya24411@gmail.com" },
  { "Name": "Saachi Goyal", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Bahamas", "Email": "saachigoyal.work@gmail.com" },
  { "Name": "Priyanshi Joshi", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Japan", "Email": "joshipriyanshi898@gmail.com" },
  { "Name": "Oishi Mondal", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Bulgaria", "Email": "oishimondal22@gmail.com" },
  { "Name": "A.D. Nethuka Yenuwan Gunathilaka", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Bangladesh", "Email": "gunathilakanethuka@gmail.com" },
  { "Name": "Syeda Fariha Tahsin", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Ethiopia", "Email": "farihatahsin2010@gmail.com" },
  { "Name": "Mustafa Çolak", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Georgia", "Email": "colakmustafa280@gmail.com" },
  { "Name": "Atahan İlgün", "Role": "Delegate", "Committee": "International Press Corps (IPC)", "Model Country": "NHK World", "Email": "atahan.ilgunn@gmail.com" },
  { "Name": "Metehan Yavaş", "Role": "Delegate", "Committee": "World Health Organization (WHO)", "Model Country": "Singapore", "Email": "metehan.yavas09@gmail.com" },
  { "Name": "Demi Espiritu", "Role": "Observer", "Committee": "N/A (Observer)", "Model Country": "N/A (Observer)", "Email": "demiannespiritu26@gmail.com" },
  { "Name": "Angel Patel", "Role": "Observer", "Committee": "N/A (Observer)", "Model Country": "N/A (Observer)", "Email": "patelangel5544@gmail.com" },
  { "Name": "Semih Akgün", "Role": "Faculty Advisor", "Committee": "N/A (Faculty Advisor)", "Model Country": "N/A (Faculty Advisor)", "Email": "akgunsemih1615@gmail.com" },
  { "Name": "Vishakha Sharma", "Role": "Faculty Advisor", "Committee": "N/A (Faculty Advisor)", "Model Country": "N/A (Faculty Advisor)", "Email": "vishakhash0000@gmail.com" }
];

export interface RosterEntry {
  id: string;
  name: string;
  role: UserRole;
  committee: string;
  country: string;
  email: string;
}

export const ROSTER_MASTER_DATA: RosterEntry[] = OFFICIAL_MYMUN_ROSTER.map((r, index) => ({
  id: `roster-${index + 1}`,
  name: r.Name,
  role: r.Role,
  committee: r.Committee,
  country: r['Model Country'],
  email: r.Email.toLowerCase().trim(),
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
  if (role === 'Observer') return ['N/A (Observer)'];
  if (isOrganiserRole(role)) return ['N/A (Event Organiser)'];
  return [...COMMITTEES];
}

/**
 * Filter countries available for a given Role and Committee.
 */
export function getAvailableCountries(role: UserRole | '', committee: string): string[] {
  if (!role || !committee) return [];
  if (role === 'Chair') return ['N/A (Chair)'];
  if (role === 'Faculty Advisor') return ['N/A (Faculty Advisor)'];
  if (role === 'Observer') return ['N/A (Observer)'];
  if (isOrganiserRole(role)) return ['N/A (Event Organiser)'];

  const matched = ROSTER_MASTER_DATA.filter(
    (entry) => entry.role === role && entry.committee === committee
  );
  const uniqueCountries = Array.from(new Set(matched.map((m) => m.country))).sort();
  return uniqueCountries;
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
      entry.country === country
  );
  return matches.map((m) => m.name);
}
