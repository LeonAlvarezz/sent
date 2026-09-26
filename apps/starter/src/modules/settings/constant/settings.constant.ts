export interface UserProfileData {
  name: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  title: string;
  department: string;
  bio: string;
  avatarUrl: string;
}

export interface UserPreferencesData {
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  deviceType: "desktop" | "mobile";
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface ConnectedAccount {
  id: string;
  provider: "google" | "github" | "apple";
  name: string;
  accountIdentifier: string;
  connectedAt?: string;
  isConnected: boolean;
}

export interface TwoFactorData {
  isEnabled: boolean;
  secret: string;
  backupCodes: string[];
}

export const INITIAL_USER_PROFILE: UserProfileData = {
  name: "Leon Alvarez",
  displayName: "leonalvarez",
  email: "leon.alvarez@company.com",
  emailVerified: true,
  phoneNumber: "+1 (555) 349-2810",
  title: "Super Administrator",
  department: "Platform Engineering",
  bio: "Core platform architect managing infrastructure, commerce operations, and admin controls.",
  avatarUrl: "https://avatars.githubusercontent.com/u/107019128?v=4",
};

export const INITIAL_USER_PREFERENCES: UserPreferencesData = {
  timezone: "America/New_York",
  language: "en-US",
  dateFormat: "YYYY-MM-DD",
  currency: "USD",
};

export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "America / New York (UTC-05:00)" },
  { value: "America/Los_Angeles", label: "America / Los Angeles (UTC-08:00)" },
  { value: "America/Chicago", label: "America / Chicago (UTC-06:00)" },
  { value: "Europe/London", label: "Europe / London (UTC+00:00)" },
  { value: "Europe/Paris", label: "Europe / Paris (UTC+01:00)" },
  { value: "Asia/Tokyo", label: "Asia / Tokyo (UTC+09:00)" },
  { value: "Asia/Bangkok", label: "Asia / Bangkok (UTC+07:00)" },
  { value: "Asia/Singapore", label: "Asia / Singapore (UTC+08:00)" },
  { value: "Australia/Sydney", label: "Australia / Sydney (UTC+10:00)" },
];

export const LANGUAGE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "vi-VN", label: "Tiếng Việt (Vietnamese)" },
  { value: "ja-JP", label: "日本語 (Japanese)" },
  { value: "de-DE", label: "Deutsch (German)" },
  { value: "fr-FR", label: "Français (French)" },
  { value: "es-ES", label: "Español (Spanish)" },
];

export const DATE_FORMAT_OPTIONS = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (e.g. 2026-08-28)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (e.g. 28/08/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (e.g. 08/28/2026)" },
  { value: "DD MMM YYYY", label: "DD MMM YYYY (e.g. 28 Aug 2026)" },
];

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "JPY", label: "JPY — Japanese Yen (¥)" },
  { value: "VND", label: "VND — Vietnamese Dong (₫)" },
  { value: "CAD", label: "CAD — Canadian Dollar ($)" },
  { value: "AUD", label: "AUD — Australian Dollar ($)" },
];

export const INITIAL_ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "sess_1",
    deviceName: 'MacBook Pro 16"',
    deviceType: "desktop",
    browser: "Chrome 128.0",
    os: "macOS Sequoia 15.1",
    ipAddress: "192.168.1.42",
    location: "San Francisco, CA, United States",
    lastActive: "2026-08-28T06:50:00Z",
    isCurrent: true,
  },
  {
    id: "sess_2",
    deviceName: "iPhone 16 Pro Max",
    deviceType: "mobile",
    browser: "Mobile Safari 18.2",
    os: "iOS 18.2",
    ipAddress: "172.56.21.9",
    location: "San Francisco, CA, United States",
    lastActive: "2026-08-28T04:30:00Z",
    isCurrent: false,
  },
  {
    id: "sess_3",
    deviceName: "Dell XPS 15",
    deviceType: "desktop",
    browser: "Firefox Developer 130",
    os: "Windows 11 Pro",
    ipAddress: "104.28.19.88",
    location: "Austin, TX, United States",
    lastActive: "2026-08-25T14:15:00Z",
    isCurrent: false,
  },
];

export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "oauth_google",
    provider: "google",
    name: "Google Account",
    accountIdentifier: "leon.alvarez@gmail.com",
    connectedAt: "2026-04-12T10:00:00Z",
    isConnected: true,
  },
  {
    id: "oauth_github",
    provider: "github",
    name: "GitHub",
    accountIdentifier: "leonalvarez-dev",
    connectedAt: "2026-05-20T16:45:00Z",
    isConnected: true,
  },
  {
    id: "oauth_apple",
    provider: "apple",
    name: "Apple ID",
    accountIdentifier: "",
    isConnected: false,
  },
];

export const INITIAL_2FA_STATE: TwoFactorData = {
  isEnabled: false,
  secret: "JBSWY3DPEHPK3PXP",
  backupCodes: [
    "4829-1094",
    "7301-8422",
    "9513-4702",
    "3810-6291",
    "6028-3914",
    "1948-5720",
    "8372-9104",
    "5291-7380",
  ],
};
