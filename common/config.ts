/**
 * Dictionary of all Google Form IDs
*/
export const QUIZ_IDS = [
    66546920, // General
    577888883, // 3D
    677552423, // Laser
    2100779718, // Waterjet
    2079405017, // Studio
    1841312496, // Spraypaint
    1235553349, // Loom
    482685426, // Welding
    913890505, // Composite
] as const; // as const allows the keys of this object to be used as types

export const PROFICIENCIES = [
    "3D Printing",
    "Advanced 3D Printing",
    "Analog Loom",
    "Cricut",
    "Digital Loom",
    "Embroidery",
    "Large Format Printer",
    "Laser Cutter",
    "Leather Sewing Machine",
    "Oscilloscopes",
    "Printing Press",
    "Sergers",
    "Sewing",
    "Soldering",
    "Spray Paint",
    "Studio (Audio)",
    "Studio (Video)",
    "Waterjet",
    "Welding",
] as const; // Keep this sorted
