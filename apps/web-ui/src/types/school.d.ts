export interface SchoolLoginTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customLoginHtml?: string;
}

export interface School {
  schoolId: string;
  schoolName: string;
  schoolLogo: string;
  schoolDbName?: string;
  mongoUri?: string;
  status: string;
  schoolAddress: string;
  schoolEmail: string;
  schoolContact: string;
  schoolWebsite: string;
  schoolTagline?: string;
  subdomain?: string;
  loginTheme?: SchoolLoginTheme;
  attendanceSettings?: {
    mode?: 'simple' | 'period_wise' | 'check_in_out';
    workingHours?: { start: string; end: string };
    lateThresholdMinutes?: number;
    halfDayThresholdMinutes?: number;
    periodsPerDay?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}