import { NormalizationResult, SampleTextItem } from '../../shared/types';

/**
 * Khmer Unicode Character Ranges:
 * U+1780 - U+17FF: Khmer main block (Consonants, Independent Vowels, Inherent Vowels, Subscript Coeng U+17D2, Signs, Digits U+17E0-U+17E9, Punctuation)
 * U+19E0 - U+19FF: Khmer Symbols (Lunar dates, etc.)
 */
const KHMER_REGEX = /[\u1780-\u17FF\u19E0-\u19FF]/;
const KHMER_GLOBAL_REGEX = /[\u1780-\u17FF\u19E0-\u19FF]/g;

/**
 * Deterministic Khmer text normalization without phonetic mangling or transliteration.
 * Follows Unicode NFC standard while trimming harmless invisible prefix artifacts.
 */
export function normalizeKhmerInput(text: string): NormalizationResult {
  if (!text) {
    return {
      normalizedText: '',
      originalText: '',
      changesMade: [],
      originalLength: 0,
      normalizedLength: 0,
      isKhmerScript: false,
      khmerCharRatio: 0,
      paragraphCount: 0,
    };
  }

  const originalText = text;
  const changes: string[] = [];

  let workingText = text;

  // 1. Strip leading BOM (Byte Order Mark \uFEFF) if present
  if (workingText.charCodeAt(0) === 0xfeff) {
    workingText = workingText.slice(1);
    changes.push('Removed leading Unicode BOM marker (U+FEFF)');
  }

  // 2. Normalize to standard Unicode NFC (Canonical Decomposition followed by Canonical Composition)
  const beforeNFC = workingText;
  workingText = workingText.normalize('NFC');
  if (beforeNFC !== workingText) {
    changes.push('Applied Unicode NFC normalization to compose base consonants and diacritic marks');
  }

  // 3. Normalize line breaks to standard Unix '\n'
  const beforeNewlines = workingText;
  workingText = workingText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (beforeNewlines !== workingText) {
    changes.push('Standardized carriage returns to standard line breaks');
  }

  // 4. Collapse runs of >2 consecutive empty lines to 2 empty lines for predictable paragraph pauses
  const beforeBlankLines = workingText;
  workingText = workingText.replace(/\n{3,}/g, '\n\n');
  if (beforeBlankLines !== workingText) {
    changes.push('Collapsed multiple empty lines to double line breaks for natural pauses');
  }

  // 5. Trim trailing whitespace from ends of lines without touching intentional indentation or Khmer zero-width spaces
  const beforeTrim = workingText;
  workingText = workingText
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
  if (beforeTrim !== workingText) {
    changes.push('Trimmed trailing spaces from line ends');
  }

  // Calculate Khmer script statistics
  const khmerMatches = workingText.match(KHMER_GLOBAL_REGEX);
  const khmerCharCount = khmerMatches ? khmerMatches.length : 0;
  const nonWhitespaceLength = workingText.replace(/\s/g, '').length;
  const khmerCharRatio = nonWhitespaceLength > 0 ? khmerCharCount / nonWhitespaceLength : 0;
  const isKhmerScript = khmerCharCount > 0 && khmerCharRatio >= 0.2;

  const paragraphs = workingText.split(/\n+/).filter((p) => p.trim().length > 0);

  return {
    normalizedText: workingText,
    originalText,
    changesMade: changes,
    originalLength: originalText.length,
    normalizedLength: workingText.length,
    isKhmerScript,
    khmerCharRatio,
    paragraphCount: paragraphs.length,
  };
}

/**
 * Calculate detailed character, word estimate, and audio time estimate for Khmer text
 */
export function getTextStats(text: string, maxLimit = 5000) {
  const normalized = text.normalize('NFC');
  const characters = normalized.length;
  const remaining = Math.max(0, maxLimit - characters);
  const hasExcessiveLength = characters > maxLimit;

  // Khmer doesn't use spaces between words; words are grouped in phrases.
  // We estimate syllables/words roughly: 1 word ~ 3 to 4 characters in Khmer, or whitespace/punctuation splits
  const khmerMatches = normalized.match(KHMER_GLOBAL_REGEX);
  const khmerChars = khmerMatches ? khmerMatches.length : 0;
  const wordsEstimate = Math.max(1, Math.round(khmerChars / 3.5) + (normalized.match(/\s+/g)?.length || 0));

  const paragraphs = normalized.split(/\n+/).filter((p) => p.trim().length > 0).length;

  // Average reading speed for Khmer speech is ~150-180 syllables per minute (~30-40 words/min equivalent)
  // Rough duration: ~10-14 Khmer characters per second
  const readingTimeSecondsEstimate = Math.max(1, Math.round(characters / 11));

  return {
    characters,
    paragraphs: Math.max(1, paragraphs),
    wordsEstimate,
    remaining,
    readingTimeSecondsEstimate,
    hasExcessiveLength,
  };
}

/**
 * Splits long text at natural Khmer boundary points: paragraph breaks, Khmer full stop (។), question/exclamation, or spaces.
 */
export function splitTextForProvider(text: string, maxCharacters = 2000): string[] {
  if (text.length <= maxCharacters) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).trim().length <= maxCharacters) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If single paragraph is still larger than maxCharacters, split by Khmer sentence marker (។ or ៕)
      if (para.length > maxCharacters) {
        const sentences = para.split(/(?<=[។៕!?\n])/);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length <= maxCharacters) {
            currentChunk += sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
            if (sentence.length > maxCharacters) {
              // Split by whitespace as last resort
              const words = sentence.split(/(\s+)/);
              for (const word of words) {
                if ((currentChunk + word).length <= maxCharacters) {
                  currentChunk += word;
                } else {
                  if (currentChunk) chunks.push(currentChunk.trim());
                  currentChunk = word;
                }
              }
            } else {
              currentChunk = sentence;
            }
          }
        }
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Convert Western digits (0-9) to Khmer digits (០-៩) or vice versa
 */
export function convertKhmerDigits(text: string, toKhmer: boolean): string {
  const westernDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

  let result = text;
  if (toKhmer) {
    for (let i = 0; i < 10; i++) {
      result = result.replaceAll(westernDigits[i], khmerDigits[i]);
    }
  } else {
    for (let i = 0; i < 10; i++) {
      result = result.replaceAll(khmerDigits[i], westernDigits[i]);
    }
  }
  return result;
}

/**
 * Clean repeated whitespaces, multiple tabs, and empty padding
 */
export function cleanKhmerDoubleSpaces(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Curated authentic Khmer sample texts for instant demonstration and testing
 */
export const KHMER_SAMPLE_TEXTS: SampleTextItem[] = [
  {
    id: 'sample-welcome',
    titleKm: 'ស្វាគមន៍មកកាន់ Soriya Voice',
    titleEn: 'Welcome to Soriya Voice',
    category: 'welcome',
    text: 'សួស្តី! សូមស្វាគមន៍មកកាន់ Soriya Voice។ កម្មវិធីបំលែងអក្សរខ្មែរទៅជាសំឡេងច្បាស់ និងពិរោះ។',
    descriptionKm: 'ឃ្លាសាកល្បងខ្លី និងគួរសមសម្រាប់សាកល្បងសំឡេងដំបូង',
    descriptionEn: 'Short polite welcome greeting for initial voice testing',
  },
  {
    id: 'sample-news',
    titleKm: 'ព័ត៌មានបច្ចេកវិទ្យា',
    titleEn: 'Tech News',
    category: 'news',
    text: 'បច្ចេកវិទ្យាបញ្ញាសិប្បនិម្មិត AI កំពុងដើរតួនាទីយ៉ាងសំខាន់ក្នុងការជំរុញការអភិវឌ្ឍសេដ្ឋកិច្ចឌីជីថលនៅកម្ពុជា និងក្នុងតំបន់អាស៊ីអាគ្នេយ៍។',
    descriptionKm: 'ព័ត៌មានបច្ចេកវិទ្យា និងការវិវត្តឌីជីថល',
    descriptionEn: 'Technology and AI development news bulletin',
  },
  {
    id: 'sample-education',
    titleKm: 'ការសិក្សារាល់ថ្ងៃ',
    titleEn: 'Daily Learning',
    category: 'education',
    text: 'ការសិក្សាបន្តិចម្តងៗរាល់ថ្ងៃ អាចនាំទៅរកការរីកចម្រើនដ៏ធំ។ ចំណេះដឹងប្រៀបដូចជាពន្លឺបំភ្លឺផ្លូវជីវិត។',
    descriptionKm: 'អត្ថបទលើកទឹកចិត្តអំពីការរៀនសូត្រប្រចាំថ្ងៃ',
    descriptionEn: 'Motivational reflection on continuous daily learning',
  },
  {
    id: 'sample-story',
    titleKm: 'រឿងនិទានសាមញ្ញ',
    titleEn: 'Storytelling',
    category: 'story',
    text: 'កាលពីព្រេងនាយ នៅភូមិតូចមួយក្បែរជើងភ្នំ មានកូនសត្វស្លាបមួយក្បាលដែលចូលចិត្តហោះហើរមើលទេសភាពធម្មជាតិដ៏ស្រស់ត្រកាលនៅពេលព្រឹកព្រលឹម។',
    descriptionKm: 'និទានរឿងខ្លីសម្រាប់សាកល្បងសំឡេងនិទាន',
    descriptionEn: 'Gentle narrative passage for testing storytelling tone',
  },
  {
    id: 'sample-planning',
    titleKm: 'ការរៀបចំកិច្ចការប្រចាំថ្ងៃ',
    titleEn: 'Daily Task Planning',
    category: 'daily',
    text: 'ថ្ងៃនេះ ខ្ញុំនឹងរៀបចំកិច្ចការសំខាន់ៗ ហើយចាប់ផ្តើមមួយជំហានម្តងៗ ដើម្បីសម្រេចគោលដៅឱ្យបានល្អ។',
    descriptionKm: 'ប្រយោគការងារ និងការរៀបចំផែនការជាក់ស្តែង',
    descriptionEn: 'Practical workflow and task planning statement',
  },
  {
    id: 'sample-proverb',
    titleKm: 'សុភាសិតខ្មែរ',
    titleEn: 'Khmer Proverb',
    category: 'proverb',
    text: 'ចេះដប់មិនស្មើប្រសប់មួយ។ ធ្វើការងារដោយយកចិត្តទុកដាក់ និងមានការអត់ធ្មត់ នឹងទទួលបានលទ្ធផលគាប់ប្រសើរ។',
    descriptionKm: 'សុភាសិតខ្មែរដកស្រង់អំពីជំនាញ និងការតស៊ូ',
    descriptionEn: 'Classic Khmer wisdom regarding mastery and perseverance',
  },
  {
    id: 'sample-announcement',
    titleKm: 'សេចក្តីជូនដំណឹង',
    titleEn: 'Public Announcement',
    category: 'announcement',
    text: 'សូមជម្រាបជូនសាធារណជនឱ្យបានជ្រាបថា សិក្ខាសាលាស្តីពីបច្ចេកវិទ្យាឌីជីថល នឹងប្រព្រឹត្តទៅនៅថ្ងៃសៅរ៍ចុងសប្តាហ៍នេះ ចាប់ពីម៉ោង ៨:៣០ នាទីព្រឹក។',
    descriptionKm: 'ទម្រង់សេចក្តីជូនដំណឹងផ្លូវការ និងកាលបរិច្ឆេទ',
    descriptionEn: 'Formal event announcement with specific timing format',
  },
];

