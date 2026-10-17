export interface DailySalesRecord {
  dayIndex: number;
  dateStr: string;
  label: string;
  units: number;
  revenue: number;
}

export const MOCK_30DAY_SALES: DailySalesRecord[] = [
  { dayIndex: 1, dateStr: "Oct 06", label: "Day 01", units: 110, revenue: 840 },
  { dayIndex: 2, dateStr: "Oct 07", label: "Day 02", units: 125, revenue: 950 },
  { dayIndex: 3, dateStr: "Oct 08", label: "Day 03", units: 138, revenue: 1040 },
  { dayIndex: 4, dateStr: "Oct 09", label: "Day 04", units: 155, revenue: 1180 },
  { dayIndex: 5, dateStr: "Oct 10", label: "Day 05", units: 130, revenue: 990 },
  { dayIndex: 6, dateStr: "Oct 11", label: "Day 06", units: 115, revenue: 860 },
  { dayIndex: 7, dateStr: "Oct 12", label: "Day 07", units: 122, revenue: 920 },
  { dayIndex: 8, dateStr: "Oct 13", label: "Day 08", units: 145, revenue: 1100 },
  { dayIndex: 9, dateStr: "Oct 14", label: "Day 09", units: 168, revenue: 1270 },
  { dayIndex: 10, dateStr: "Oct 15", label: "Day 10", units: 135, revenue: 1020 },
  { dayIndex: 11, dateStr: "Oct 16", label: "Day 11", units: 125, revenue: 940 },
  { dayIndex: 12, dateStr: "Oct 17", label: "Day 12", units: 132, revenue: 995 },
  { dayIndex: 13, dateStr: "Oct 18", label: "Day 13", units: 152, revenue: 1150 },
  { dayIndex: 14, dateStr: "Oct 19", label: "Day 14", units: 172, revenue: 1290 },
  { dayIndex: 15, dateStr: "Oct 20", label: "Day 15", units: 140, revenue: 1050 },
  { dayIndex: 16, dateStr: "Oct 21", label: "Day 16", units: 130, revenue: 980 },
  { dayIndex: 17, dateStr: "Oct 22", label: "Day 17", units: 138, revenue: 1040 },
  { dayIndex: 18, dateStr: "Oct 23", label: "Day 18", units: 160, revenue: 1210 },
  { dayIndex: 19, dateStr: "Oct 24", label: "Day 19", units: 175, revenue: 1320 },
  { dayIndex: 20, dateStr: "Oct 25", label: "Day 20", units: 148, revenue: 1120 },
  { dayIndex: 21, dateStr: "Oct 26", label: "Day 21", units: 136, revenue: 1030 },
  { dayIndex: 22, dateStr: "Oct 27", label: "Day 22", units: 144, revenue: 1090 },
  { dayIndex: 23, dateStr: "Oct 28", label: "Day 23", units: 165, revenue: 1240 },
  { dayIndex: 24, dateStr: "Oct 29", label: "Day 24", units: 184, revenue: 1290 }, // Peak as shown in image
  { dayIndex: 25, dateStr: "Oct 30", label: "Day 25", units: 156, revenue: 1180 },
  { dayIndex: 26, dateStr: "Oct 31", label: "Day 26", units: 142, revenue: 1070 },
  { dayIndex: 27, dateStr: "Nov 01", label: "Day 27", units: 148, revenue: 1115 },
  { dayIndex: 28, dateStr: "Nov 02", label: "Day 28", units: 162, revenue: 1220 },
  { dayIndex: 29, dateStr: "Nov 03", label: "Day 29", units: 170, revenue: 1280 },
  { dayIndex: 30, dateStr: "Nov 04", label: "Day 30", units: 158, revenue: 1190 },
];

export const INITIAL_RECENT_MOVEMENTS = [
  {
    id: "mov-01",
    productName: "Napa Extra 500mg",
    type: "Sale",
    loggedBy: "Elena R.",
    signedQuantity: -4,
    timestamp: "Today, 10:42 AM",
  },
  {
    id: "mov-02",
    productName: "Saline 500ml IV",
    type: "Stock In",
    loggedBy: "Marcus K.",
    signedQuantity: 48,
    timestamp: "Today, 09:15 AM",
  },
  {
    id: "mov-03",
    productName: "Vitamin C 1000mg Effervescent",
    type: "Sale",
    loggedBy: "Elena R.",
    signedQuantity: -12,
    timestamp: "Today, 08:30 AM",
  },
  {
    id: "mov-04",
    productName: "Amoxicillin 500mg Trihydrate",
    type: "Adjustment",
    loggedBy: "Elena R.",
    signedQuantity: 15,
    timestamp: "Yesterday",
  },
  {
    id: "mov-05",
    productName: "Antacid Chewable Mint",
    type: "Sale",
    loggedBy: "Sarah L.",
    signedQuantity: -6,
    timestamp: "Yesterday",
  },
  {
    id: "mov-06",
    productName: "Omeprazole 20mg Delayed",
    type: "Sale",
    loggedBy: "Marcus K.",
    signedQuantity: -2,
    timestamp: "2 days ago",
  },
  {
    id: "mov-07",
    productName: "Oral Rehydration Salts (ORS)",
    type: "Stock In",
    loggedBy: "Marcus K.",
    signedQuantity: 100,
    timestamp: "3 days ago",
  },
];
