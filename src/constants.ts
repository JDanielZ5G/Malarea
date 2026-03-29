export const CAMPUS_ZONES = [
  "Allan Galphin Health Centre",
  "Main Campus - Administration",
  "Bishop Tucker Building",
  "Sabili Hall",
  "Highfield Hall",
  "East Wing Hall",
  "Cafeteria / Dining Hall",
  "Sports Ground / Pavilion",
  "Tech Park / Engineering",
  "UCU Main Gate",
  "Off-Campus: Mukono Town",
  "Off-Campus: Hostels (External)"
];

export const EMERGENCY_SYMPTOMS = [
  "Unconscious / Not Responding",
  "Chest Pain / Heart Attack",
  "Severe Bleeding",
  "Seizure / Convulsions",
  "Breathing Difficulty",
  "Severe Choking",
  "Broken Bone / Fracture",
  "Allergic Reaction (Anaphylaxis)",
  "Poisoning / Overdose",
  "Severe Burn",
  "Sudden Weakness / Stroke",
  "Other Emergency"
];

export const THEME_COLORS = {
  primary: "#003399", // UCU Blue
  secondary: "#D90000", // UCU Red
  accent: "#FFCC00", // Gold/Yellow accent
  white: "#FFFFFF",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#0F172A"
};

export const FIRST_AID_CARDS = [
  {
    id: "cpr",
    title: "CPR (Cardiopulmonary Resuscitation)",
    steps: [
      "Check the scene for safety.",
      "Check responsiveness: Tap and shout.",
      "Call for help immediately (SOS triggered).",
      "Place hands in center of chest.",
      "Push hard and fast (100-120 bpm).",
      "Allow chest to recoil between compressions."
    ],
    icon: "HeartPulse"
  },
  {
    id: "bleeding",
    title: "Severe Bleeding Control",
    steps: [
      "Apply direct pressure with a clean cloth.",
      "Keep pressure constant until help arrives.",
      "If cloth soaks through, add more on top.",
      "Elevate the limb if possible.",
      "Do not remove original bandage."
    ],
    icon: "Droplets"
  },
  {
    id: "seizure",
    title: "Seizure Management",
    steps: [
      "Keep the person safe from nearby objects.",
      "Do NOT restrain the person.",
      "Do NOT put anything in their mouth.",
      "Place something soft under their head.",
      "Time the seizure if possible.",
      "Roll them onto their side after it stops."
    ],
    icon: "Activity"
  },
  {
    id: "choking",
    title: "Choking (Heimlich Maneuver)",
    steps: [
      "Stand behind the person.",
      "Wrap arms around their waist.",
      "Make a fist above their navel.",
      "Grasp fist with other hand.",
      "Perform quick, upward abdominal thrusts.",
      "Repeat until object is expelled."
    ],
    icon: "Wind"
  }
];
