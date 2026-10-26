import { Role } from "@prisma/client";

export interface DemoUserOption {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleTitle: string;
  avatar: string;
  bio: string;
  badgeColor: string;
  primaryActionUrl: string;
}

export const DEMO_USERS: DemoUserOption[] = [
  {
    id: "usr-farmer-01",
    email: "farmer.mallesham@projectbackbone.demo",
    name: "Mallesham Goud",
    role: Role.FARMER,
    roleTitle: "Smallholder Hydroponics Farmer",
    avatar: "MG",
    bio: "0.25-Acre Vertical Hydroponic A-Frame unit in Dharmasagar Mandal, Warangal.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    primaryActionUrl: "/dashboard",
  },
  {
    id: "usr-operator-01",
    email: "operator.swapna@projectbackbone.demo",
    name: "Swapna Reddy",
    role: Role.FRANCHISE_OPERATOR,
    roleTitle: "Cluster Franchise Operator",
    avatar: "SR",
    bio: "Managing 5 poly-canopy & hydroponic farm installations across Warangal North.",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    primaryActionUrl: "/dashboard",
  },
  {
    id: "usr-agronomist-01",
    email: "agronomist.ramesh@projectbackbone.demo",
    name: "Dr. Ramesh V. Rao",
    role: Role.AGRONOMIST,
    roleTitle: "Lead Agronomy Advisor",
    avatar: "RR",
    bio: "Horticulture scientist monitoring crop growth cycles, pest thresholds & fertigation recipes.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    primaryActionUrl: "/dashboard",
  },
  {
    id: "usr-buyer-01",
    email: "buyer.kavitha@projectbackbone.demo",
    name: "Kavitha Sunder",
    role: Role.BUYER,
    roleTitle: "B2B Retail Procurement Head",
    avatar: "KS",
    bio: "Hyderabad Fresh Marts - sourcing certified Grade-A greens and spices directly from farmgate.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    primaryActionUrl: "/marketplace",
  },
  {
    id: "usr-logistics-01",
    email: "logistics.naresh@projectbackbone.demo",
    name: "Naresh Naik",
    role: Role.LOGISTICS_OPERATOR,
    roleTitle: "Cold-Chain Fleet Captain",
    avatar: "NN",
    bio: "Operating temperature-controlled reefers along the Mulugu-Warangal-Hyderabad corridor.",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    primaryActionUrl: "/logistics",
  },
  {
    id: "usr-admin-01",
    email: "admin.rajeev@projectbackbone.demo",
    name: "Rajeev Chary",
    role: Role.ADMIN,
    roleTitle: "State Network Administrator",
    avatar: "RC",
    bio: "Piloting Project Backbone across Telangana agricultural corridors with real-time auditability.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    primaryActionUrl: "/dashboard",
  },
];

export interface NavigationItem {
  name: string;
  href: string;
  iconName: string;
  allowedRoles: Role[];
  badge?: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: "Overview Dashboard",
    href: "/dashboard",
    iconName: "LayoutDashboard",
    allowedRoles: [
      Role.ADMIN,
      Role.FARMER,
      Role.FRANCHISE_OPERATOR,
      Role.AGRONOMIST,
      Role.BUYER,
      Role.LOGISTICS_OPERATOR,
    ],
  },
  {
    name: "Farm Units",
    href: "/farms",
    iconName: "Home",
    allowedRoles: [Role.ADMIN, Role.FRANCHISE_OPERATOR, Role.FARMER],
  },
  {
    name: "Infrastructure & Assets",
    href: "/infrastructure",
    iconName: "Cpu",
    allowedRoles: [Role.ADMIN, Role.FRANCHISE_OPERATOR],
  },
  {
    name: "Crop Operations",
    href: "/crops",
    iconName: "Sprout",
    allowedRoles: [
      Role.ADMIN,
      Role.FARMER,
      Role.AGRONOMIST,
      Role.FRANCHISE_OPERATOR,
    ],
  },
  {
    name: "IoT Sensors & Alerts",
    href: "/sensors",
    iconName: "Activity",
    allowedRoles: [
      Role.ADMIN,
      Role.FRANCHISE_OPERATOR,
      Role.AGRONOMIST,
      Role.FARMER,
    ],
  },
  {
    name: "Agronomy Advisories",
    href: "/advisories",
    iconName: "BookOpenCheck",
    allowedRoles: [Role.ADMIN, Role.AGRONOMIST, Role.FARMER],
  },
  {
    name: "Harvests & Traceability",
    href: "/harvests",
    iconName: "Layers",
    allowedRoles: [
      Role.ADMIN,
      Role.FARMER,
      Role.BUYER,
      Role.AGRONOMIST,
      Role.FRANCHISE_OPERATOR,
    ],
  },
  {
    name: "Buyback Offers",
    href: "/buyback",
    iconName: "HandCoins",
    allowedRoles: [Role.ADMIN, Role.FARMER],
  },
  {
    name: "B2B Marketplace",
    href: "/marketplace",
    iconName: "Store",
    allowedRoles: [Role.ADMIN, Role.BUYER],
  },
  {
    name: "Orders & Contracts",
    href: "/orders",
    iconName: "ShoppingBag",
    allowedRoles: [Role.ADMIN, Role.BUYER, Role.LOGISTICS_OPERATOR],
  },
  {
    name: "Logistics & Shipments",
    href: "/logistics",
    iconName: "Truck",
    allowedRoles: [Role.ADMIN, Role.LOGISTICS_OPERATOR, Role.FRANCHISE_OPERATOR],
  },
  {
    name: "Finance & Settlements",
    href: "/finance",
    iconName: "Landmark",
    allowedRoles: [Role.ADMIN, Role.FARMER, Role.BUYER],
  },
  {
    name: "Impact Targets (KPIs)",
    href: "/impact",
    iconName: "TrendingUp",
    allowedRoles: [
      Role.ADMIN,
      Role.FARMER,
      Role.FRANCHISE_OPERATOR,
      Role.AGRONOMIST,
      Role.BUYER,
      Role.LOGISTICS_OPERATOR,
    ],
  },
  {
    name: "Notifications",
    href: "/notifications",
    iconName: "Bell",
    allowedRoles: [
      Role.ADMIN,
      Role.FARMER,
      Role.FRANCHISE_OPERATOR,
      Role.AGRONOMIST,
      Role.BUYER,
      Role.LOGISTICS_OPERATOR,
    ],
  },
  {
    name: "Audit Trail",
    href: "/admin/audit",
    iconName: "ShieldAlert",
    allowedRoles: [Role.ADMIN],
  },
  {
    name: "System Settings",
    href: "/admin/settings",
    iconName: "Settings",
    allowedRoles: [Role.ADMIN],
  },
];

export const DEMO_TIMELINE_LABEL = "Pilot Demonstration Time: Oct 2026 (Active Simulation)";
