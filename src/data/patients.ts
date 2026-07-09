export type AlertLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface DeviceReading {
  label: string
  value: string
  unit?: string
}

export interface Patient {
  id: string
  name: string
  age: number
  alertLevel: AlertLevel
  alertTitle: string
  alertDescription: string
  deviceModel: string
  deviceId: string
  implantDate: string
  readings: DeviceReading[]
  clinicalNotes: string
}

export const patients: Patient[] = [
  {
    id: "p1",
    name: "Don Pham",
    age: 67,
    alertLevel: 10,
    alertTitle: "VT Storm Detected",
    alertDescription: "Three or more sustained ventricular tachycardia episodes in 24 hours. Device delivered ATP therapy twice; third episode terminated with shock. Immediate clinical evaluation required.",
    deviceModel: "Medtronic Cobalt XT ICD",
    deviceId: "MDT-CXT-884421",
    implantDate: "2021-03-14",
    readings: [
      { label: "Heart Rate", value: "118", unit: "bpm" },
      { label: "Last VT Episode", value: "04:32", unit: "ago" },
      { label: "ATP Therapies", value: "2", unit: "today" },
      { label: "Shocks Delivered", value: "1", unit: "today" },
      { label: "Battery Life Left", value: "4.1", unit: "yr" },
      { label: "Lead Impedance", value: "512", unit: "Ω" },
    ],
    clinicalNotes: "Patient has history of ischemic cardiomyopathy (EF 28%). Recent electrolyte panel showed hypokalemia (K+ 3.1). Consider urgent admission and electrophysiology consult. Antiarrhythmic therapy optimization needed.",
  },
  {
    id: "p2",
    name: "Lily Wei",
    age: 72,
    alertLevel: 9,
    alertTitle: "Lead Impedance Critical",
    alertDescription: "RV lead impedance out of acceptable range at 198 Ω (normal 300–1000 Ω). Possible lead insulation breach. Pacing integrity may be compromised.",
    deviceModel: "Medtronic Cobalt XT CRT-D",
    deviceId: "MDT-CXT-771203",
    implantDate: "2020-07-22",
    readings: [
      { label: "RV Lead Impedance", value: "198", unit: "Ω" },
      { label: "LV Lead Impedance", value: "624", unit: "Ω" },
      { label: "RA Lead Impedance", value: "581", unit: "Ω" },
      { label: "Pacing %", value: "94", unit: "%" },
      { label: "Battery Life Left", value: "2.8", unit: "yr" },
      { label: "Heart Rate", value: "72", unit: "bpm" },
    ],
    clinicalNotes: "Patient is pacing-dependent (complete heart block). RV lead impedance trending downward over 3 weeks. Previous reading was 241 Ω. Chest X-ray ordered to assess lead position. May require lead revision.",
  },
  {
    id: "p3",
    name: "Sergey Barabanoff",
    age: 58,
    alertLevel: 8,
    alertTitle: "AF Burden Elevated",
    alertDescription: "Atrial fibrillation burden reached 47% over the past 7 days, up from 12% baseline. Sustained AF episode of 18 hours recorded. Stroke risk assessment recommended.",
    deviceModel: "Medtronic Evera MRI XT DR ICD",
    deviceId: "MDT-EVR-559912",
    implantDate: "2022-01-09",
    readings: [
      { label: "AF Burden (7d)", value: "47", unit: "%" },
      { label: "Longest AF Episode", value: "18.2", unit: "hr" },
      { label: "Ventricular Rate in AF", value: "104", unit: "bpm" },
      { label: "Battery Life Left", value: "5.0", unit: "yr" },
      { label: "Sensing Amplitude", value: "4.2", unit: "mV" },
      { label: "Mode Switch Events", value: "23", unit: "this week" },
    ],
    clinicalNotes: "CHA₂DS₂-VASc score of 4. Currently on apixaban 5mg BID — confirm compliance. Consider rate control optimization. Cardiology appointment scheduled 2026-07-18. If AF burden persists, ablation referral warranted.",
  },
  {
    id: "p4",
    name: "Michael Rosas Ceronio",
    age: 64,
    alertLevel: 6,
    alertTitle: "Battery Depletion Warning",
    alertDescription: "Device battery voltage at 2.71 V, approaching elective replacement indicator (ERI). Estimated longevity is 3–4 months. Generator replacement planning should begin.",
    deviceModel: "Medtronic Claria MRI CRT-D",
    deviceId: "MDT-CLR-330847",
    implantDate: "2018-11-30",
    readings: [
      { label: "Battery Life Left", value: "3", unit: "mo" },
      { label: "Est. Longevity", value: "~3", unit: "mo" },
      { label: "CRT Pacing %", value: "98", unit: "%" },
      { label: "RV Impedance", value: "487", unit: "Ω" },
      { label: "LV Impedance", value: "612", unit: "Ω" },
      { label: "Heart Rate", value: "68", unit: "bpm" },
    ],
    clinicalNotes: "Patient upgraded from dual-chamber ICD to CRT-D in 2018 after EF declined to 22%. EF has since improved to 38% with resynchronization therapy. Pre-op labs and surgical planning to be initiated this visit cycle.",
  },
  {
    id: "p5",
    name: "Talise Baker-Matsuoka",
    age: 51,
    alertLevel: 5,
    alertTitle: "Sensing Threshold Low",
    alertDescription: "R-wave sensing amplitude at 3.1 mV, below programmed sensitivity threshold of 4.0 mV. Risk of undersensing ventricular events. Device reprogramming may be required.",
    deviceModel: "Medtronic Cobalt XT ICD",
    deviceId: "MDT-CXT-662018",
    implantDate: "2023-05-17",
    readings: [
      { label: "R-wave Amplitude", value: "3.1", unit: "mV" },
      { label: "Programmed Threshold", value: "4.0", unit: "mV" },
      { label: "Lead Impedance", value: "541", unit: "Ω" },
      { label: "Battery Life Left", value: "6.2", unit: "yr" },
      { label: "Heart Rate", value: "74", unit: "bpm" },
      { label: "Pacing %", value: "12", unit: "%" },
    ],
    clinicalNotes: "Younger patient with hypertrophic cardiomyopathy. Lead performance was stable for 18 months prior. Recent amplitude decline noted at last 3 transmissions. Remote reprogramming feasible; schedule device clinic review.",
  },
  {
    id: "p6",
    name: "Shreya Patil",
    age: 76,
    alertLevel: 4,
    alertTitle: "Elevated Fluid Index",
    alertDescription: "OptiVol fluid index crossed threshold of 60 Ω-days, suggesting early pulmonary congestion. Patient has not reported dyspnea. Proactive diuretic adjustment may be indicated.",
    deviceModel: "Medtronic LINQ II ICM",
    deviceId: "MDT-CLR-445521",
    implantDate: "2019-08-03",
    readings: [
      { label: "OptiVol Index", value: "63", unit: "Ω-days" },
      { label: "Threshold", value: "60", unit: "Ω-days" },
      { label: "Thoracic Impedance", value: "48", unit: "Ω" },
      { label: "CRT Pacing %", value: "96", unit: "%" },
      { label: "Battery Life Left", value: "4.5", unit: "yr" },
      { label: "Heart Rate", value: "64", unit: "bpm" },
    ],
    clinicalNotes: "Patient with HFrEF (EF 30%) and LBBB. Currently on furosemide 40mg daily. OptiVol trend crossing threshold is a new finding. Recommend phone follow-up to assess symptoms and consider furosemide uptitration to 80mg.",
  },
  {
    id: "p7",
    name: "Justin Reid",
    age: 43,
    alertLevel: 2,
    alertTitle: "Routine Monitoring",
    alertDescription: "All device parameters within normal limits. Scheduled quarterly remote transmission received and reviewed. No actionable findings.",
    deviceModel: "Medtronic LINQ II ICM",
    deviceId: "MDT-EVR-221784",
    implantDate: "2024-02-28",
    readings: [
      { label: "Heart Rate", value: "71", unit: "bpm" },
      { label: "R-wave Amplitude", value: "8.4", unit: "mV" },
      { label: "Lead Impedance", value: "534", unit: "Ω" },
      { label: "Battery Life Left", value: "7.1", unit: "yr" },
      { label: "Pacing %", value: "3", unit: "%" },
      { label: "AF Burden (7d)", value: "0", unit: "%" },
    ],
    clinicalNotes: "Patient implanted prophylactically following genetic testing confirming ARVC. Asymptomatic and physically active. Advised to avoid high-intensity competitive exercise per HCM guidelines. Next in-office visit Q6 months.",
  },
  {
    id: "p8",
    name: "Jayla Driver",
    age: 69,
    alertLevel: 1,
    alertTitle: "All Parameters Stable",
    alertDescription: "Device operating normally. All sensing, pacing, and battery parameters within expected ranges. No arrhythmia episodes logged since last transmission.",
    deviceModel: "Medtronic LINQ II ICM",
    deviceId: "MDT-CLR-118833",
    implantDate: "2021-09-12",
    readings: [
      { label: "Heart Rate", value: "66", unit: "bpm" },
      { label: "CRT Pacing %", value: "99", unit: "%" },
      { label: "RV Impedance", value: "498", unit: "Ω" },
      { label: "LV Impedance", value: "577", unit: "Ω" },
      { label: "Battery Life Left", value: "5.7", unit: "yr" },
      { label: "OptiVol Index", value: "14", unit: "Ω-days" },
    ],
    clinicalNotes: "Excellent responder to CRT therapy. EF improved from 20% to 45% over 3 years. Patient reports good functional status (NYHA Class I). Continue current medications. Annual in-person device check scheduled for September 2026.",
  },
  {
    id: "p9",
    name: "John Smith",
    age: 68,
    alertLevel: 7,
    alertTitle: "Elevated Blood Pressure Detected",
    alertDescription: "Reading of 142/91 mmHg at 9:14 AM exceeded the target range (<130/80). Patient portal indicates Dr Doof has been notified and follow-up is required.",
    deviceModel: "Medtronic LINQ II ICM",
    deviceId: "CLN-2847-JS",
    implantDate: "2022-06-18",
    readings: [
      { label: "Blood Pressure", value: "142/91", unit: "mmHg" },
      { label: "Heart Rate", value: "74", unit: "bpm" },
      { label: "SpO2", value: "97", unit: "%" },
      { label: "Weight", value: "176.2", unit: "lbs" },
      { label: "Steps Today", value: "4218" },
      { label: "Battery Life Left", value: "3.6", unit: "yr" },
    ],
    clinicalNotes: "Clinical profile from patient portal: CHF Stage II, blood type A+, under care of Dr Doof. Target ranges: HR 60-100 bpm, BP <130/80 mmHg, SpO2 >=95%, daily weight change <2 lbs/day. Current medications: Lisinopril 10 mg daily, Carvedilol 6.25 mg twice daily, Furosemide 40 mg daily, Spironolactone 25 mg daily. Recent activity includes BP 142/91, HR 74 bpm, SpO2 97%, and weight 176.2 lbs.",
  },
]
