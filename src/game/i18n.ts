export type Language = 'en' | 'ar';

const messages = {
  en: {
    eyebrow: 'YOUR DAILY BRAIN BREAK', titleA: 'ODD ONE', titleB: 'OUT.', subtitle: 'One tiny detail. Five quick rounds. How sharp are you today?',
    playDaily: "Play today's challenge", practice: 'Free play', rulesTitle: 'HOW TO PLAY', rulesBody: 'Find the one shape that is different before the timer runs out. Each round changes one detail.',
    daily: 'Daily puzzle', practiceMode: 'Practice mode', round: 'ROUND', of: 'OF', find: 'Find the odd one out', seconds: 'sec', streak: 'DAY STREAK', best: 'PERSONAL BEST', sound: 'Sound', language: 'Language',
    color: 'Different color', rotation: 'Different rotation', size: 'Different size', symbol: 'Different symbol', correct: 'Nice spot!', incorrect: 'Not that one — keep looking!', timeUp: "Time's up!",
    result: 'PUZZLE COMPLETE', dailyComplete: 'YOU DID IT.', resultSubtitle: 'A little focus goes a long way.', score: 'SCORE', accuracy: 'FOUND', mistakes: 'MISTAKES', time: 'TIME',
    playAgain: 'Play again', share: 'Share result', shareDaily: 'Share daily puzzle', downloadCard: 'Save result card', copyLink: 'Copy challenge link', copied: 'Copied to clipboard!', shareError: 'Could not share automatically. Link copied instead.',
    bestNew: 'NEW PERSONAL BEST!', history: 'RECENT GAMES', noHistory: 'Your first game will show up here.', install: 'Install app', installHint: 'Add it to your home screen for a quick daily brain break.',
    modeDaily: 'DAILY', modePractice: 'PRACTICE', back: 'Back home', next: 'Next round', play: 'Start playing',
    roundHint: 'One of these shapes is a little different.', dailyTag: 'SAME PUZZLE FOR EVERYONE', localData: 'Your stats stay on this device.', noBest: 'Not yet', close: 'Close',
  },
  ar: {
    eyebrow: 'استراحة ذهنية يومية', titleA: 'اكتشف', titleB: 'المختلف.', subtitle: 'تفصيل صغير. خمس جولات سريعة. قديش تركيزك اليوم؟',
    playDaily: 'العب تحدّي اليوم', practice: 'لعب حر', rulesTitle: 'كيف تلعب؟', rulesBody: 'اكتشف الشكل المختلف قبل انتهاء الوقت. في كل جولة يتغيّر تفصيل واحد فقط.',
    daily: 'لغز اليوم', practiceMode: 'وضع التدريب', round: 'الجولة', of: 'من', find: 'اكتشف الشكل المختلف', seconds: 'ث', streak: 'أيام متتالية', best: 'أفضل نتيجة', sound: 'الصوت', language: 'اللغة',
    color: 'لون مختلف', rotation: 'دوران مختلف', size: 'حجم مختلف', symbol: 'رمز مختلف', correct: 'عينك قوية!', incorrect: 'مش هو — جرّب كمان!', timeUp: 'خلص الوقت!',
    result: 'اكتمل اللغز', dailyComplete: 'أحسنت!', resultSubtitle: 'تركيز بسيط بيعمل فرق.', score: 'النتيجة', accuracy: 'إجابات صحيحة', mistakes: 'أخطاء', time: 'الوقت',
    playAgain: 'العب مرة ثانية', share: 'شارك النتيجة', shareDaily: 'شارك لغز اليوم', downloadCard: 'احفظ بطاقة النتيجة', copyLink: 'انسخ رابط التحدّي', copied: 'تم النسخ!', shareError: 'تعذّرت المشاركة التلقائية. تم نسخ الرابط.',
    bestNew: 'أفضل نتيجة جديدة!', history: 'آخر الألعاب', noHistory: 'نتيجتك الأولى ستظهر هون.', install: 'ثبّت التطبيق', installHint: 'أضفه للشاشة الرئيسية لتلعب بسهولة كل يوم.',
    modeDaily: 'يومي', modePractice: 'تدريب', back: 'العودة للرئيسية', next: 'الجولة التالية', play: 'ابدأ اللعب',
    roundHint: 'في شكل واحد مختلف شوي عن الباقي.', dailyTag: 'نفس اللغز للجميع', localData: 'إحصائياتك محفوظة على جهازك.', noBest: 'لسّه', close: 'إغلاق',
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export function t(language: Language, key: MessageKey): string {
  return messages[language][key] ?? messages.en[key];
}
