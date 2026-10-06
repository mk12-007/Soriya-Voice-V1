import { VoiceStyleOption } from '../../shared/types';

export const KHMER_VOICE_STYLES: VoiceStyleOption[] = [
  {
    id: 'natural',
    nameKm: 'ធម្មជាតិ (Natural)',
    nameEn: 'Natural & Balanced',
    descriptionKm: 'សំនៀងធម្មជាតិ សមរម្យសម្រាប់ការសន្ទនា និងអានអត្ថបទប្រចាំថ្ងៃ',
    descriptionEn: 'Clear, balanced everyday conversational delivery with natural pauses.',
    iconName: 'Sparkles',
    promptInstruction: 'Deliver with a natural, clear, and authentic everyday conversational tone.',
  },
  {
    id: 'storytelling',
    nameKm: 'និទានរឿង (Storytelling)',
    nameEn: 'Storytelling & Narration',
    descriptionKm: 'សំនៀងរៀបរាប់ ប្រកបដោយមនោសញ្ចេតនា និងទម្ងន់សំឡេងស្រទន់',
    descriptionEn: 'Expressive narration cadence with dramatic pauses and emotional warmth.',
    iconName: 'BookOpen',
    promptInstruction: 'Deliver with an expressive, captivating storytelling cadence, emotional nuance, and dramatic warmth.',
  },
  {
    id: 'formal',
    nameKm: 'ផ្លូវការ & ព័ត៌មាន (Formal & News)',
    nameEn: 'News & Official',
    descriptionKm: 'សំនៀងច្បាស់ៗ ម៉ឺងម៉ាត់ ល្អសម្រាប់ការប្រកាស និងព័ត៌មានផ្លូវការ',
    descriptionEn: 'Authoritative, articulate, and broadcast-ready announcement cadence.',
    iconName: 'Radio',
    promptInstruction: 'Deliver with a formal, authoritative, crisp, and broadcast-ready announcement cadence.',
  },
  {
    id: 'educational',
    nameKm: 'អប់រំ & ពន្យល់ (Educational)',
    nameEn: 'Educational & Tutorial',
    descriptionKm: 'សំនៀងមួយៗ ច្បាស់ៗ សមស្របសម្រាប់មេរៀន និងវីដេអូបង្រៀន',
    descriptionEn: 'Articulate, patient, and pedagogical explanatory tone suitable for learning.',
    iconName: 'GraduationCap',
    promptInstruction: 'Deliver with an articulate, patient, encouraging, and pedagogical explanatory tone.',
  },
  {
    id: 'energetic',
    nameKm: 'រស់រវើក & រីករាយ (Energetic)',
    nameEn: 'Energetic & Cheerful',
    descriptionKm: 'សំនៀងរស់រវើក រីករាយ និងមានភាពទាក់ទាញខ្ពស់',
    descriptionEn: 'Upbeat, cheerful, and dynamic delivery with engaging emphasis.',
    iconName: 'Zap',
    promptInstruction: 'Deliver with an upbeat, enthusiastic, energetic, friendly, and lively delivery.',
  },
  {
    id: 'calm',
    nameKm: 'ស្រទន់ & ស្ងប់ស្ងាត់ (Calm & Soothing)',
    nameEn: 'Calm & Soothing',
    descriptionKm: 'សំនៀងស្រាល ស្រទន់ ជួយបង្កើតអារម្មណ៍ស្ងប់ស្ងាត់ និងសម្រាក',
    descriptionEn: 'Gentle, soothing, and relaxing cadence with smooth pacing.',
    iconName: 'Heart',
    promptInstruction: 'Deliver with a gentle, soothing, relaxed, tranquil, and warm bedtime tone.',
  },
  {
    id: 'poetic',
    nameKm: 'កាព្យ & សិល្បៈ (Poetic & Literature)',
    nameEn: 'Poetic & Literary',
    descriptionKm: 'សំនៀងមានចង្វាក់ភ្លេង ពីរោះរណ្ដំ សមស្របសម្រាប់កំណាព្យ និងអក្សរសិល្ប៍',
    descriptionEn: 'Melodic and rhythmic cadence fitting Khmer poetry and classical literature.',
    iconName: 'Music',
    promptInstruction: 'Deliver with an expressive, melodic, lyrical cadence fitting Khmer poetry and classical literature.',
  },
];

export function getVoiceStyleById(styleId?: string): VoiceStyleOption {
  return (
    KHMER_VOICE_STYLES.find((s) => s.id === styleId) || KHMER_VOICE_STYLES[0]
  );
}
