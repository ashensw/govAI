// Minimal UI-chrome i18n dictionary for the GovAI PoC. This only translates
// interface strings (nav, buttons, headers, empty states) — NOT chat/document
// content, which is left as returned by the backend. Sinhala and Tamil strings
// are best-effort for demo purposes and should be reviewed by a native speaker
// before any real deployment.

export type Locale = "en" | "si" | "ta";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  si: "සිං",
  ta: "தமிழ்",
};

export interface Dictionary {
  appName: string;
  appTagline: string;
  poc: string;
  pocDisclaimer: string;
  footerNote: string;

  navChat: string;
  navDocuments: string;
  navAdmin: string;
  logout: string;

  loginTitle: string;
  loginSubtitle: string;
  emailLabel: string;
  passwordLabel: string;
  loginButton: string;
  loginLoading: string;
  loginError: string;

  chatNewSession: string;
  chatSessionsTitle: string;
  chatEmptySessions: string;
  chatDeleteSession: string;
  chatInputPlaceholder: string;
  chatSend: string;
  chatEmptyThread: string;
  chatSourcesLabel: string;
  chatGroundedNotice: string;
  chatThinking: string;
  chatPage: string;
  chatScore: string;

  documentsTitle: string;
  documentsUploadTitle: string;
  documentsDropHint: string;
  documentsBrowse: string;
  documentsDepartment: string;
  documentsClassification: string;
  documentsTitleField: string;
  documentsTitleOptional: string;
  documentsUploadButton: string;
  documentsUploading: string;
  documentsTableTitle: string;
  documentsTableFilename: string;
  documentsTableDepartment: string;
  documentsTableClassification: string;
  documentsTableStatus: string;
  documentsTableLanguage: string;
  documentsTablePages: string;
  documentsTableUploaded: string;
  documentsTableActions: string;
  documentsEmpty: string;
  documentsAllDepartments: string;
  documentsDelete: string;
  documentsDeleteConfirm: string;
  documentsStatusProcessing: string;
  documentsStatusReady: string;
  documentsStatusFailed: string;
  classificationPublic: string;
  classificationRestricted: string;
  classificationConfidential: string;

  adminTitle: string;
  adminStatDocuments: string;
  adminStatUsers: string;
  adminStatChats: string;
  adminByDepartment: string;
  adminAuditLog: string;
  adminAuditTimestamp: string;
  adminAuditUser: string;
  adminAuditAction: string;
  adminAuditResource: string;
  adminPrev: string;
  adminNext: string;
  adminEmptyAudit: string;

  loading: string;
  error: string;
  cancel: string;
  confirm: string;
}

const en: Dictionary = {
  appName: "GovAI",
  appTagline: "Private AI Assistant",
  poc: "Proof of Concept",
  pocDisclaimer: "Prototype — not an official government system",
  footerNote: "Proof of Concept — Not for operational use",

  navChat: "Chat",
  navDocuments: "Documents",
  navAdmin: "Admin",
  logout: "Log out",

  loginTitle: "Sign in to GovAI",
  loginSubtitle: "Private AI Assistant — internal demo access",
  emailLabel: "Email",
  passwordLabel: "Password",
  loginButton: "Sign in",
  loginLoading: "Signing in…",
  loginError: "Invalid email or password. Please try again.",

  chatNewSession: "New chat",
  chatSessionsTitle: "Conversations",
  chatEmptySessions: "No conversations yet",
  chatDeleteSession: "Delete conversation",
  chatInputPlaceholder: "Ask a question about government documents…",
  chatSend: "Send",
  chatEmptyThread: "Start a conversation to query authorized documents",
  chatSourcesLabel: "Sources",
  chatGroundedNotice:
    "Responses are grounded only in documents you are authorized to access.",
  chatThinking: "Thinking…",
  chatPage: "Page",
  chatScore: "Relevance",

  documentsTitle: "Documents",
  documentsUploadTitle: "Upload a document",
  documentsDropHint: "Drag and drop a file here, or",
  documentsBrowse: "browse",
  documentsDepartment: "Department",
  documentsClassification: "Classification",
  documentsTitleField: "Title",
  documentsTitleOptional: "optional",
  documentsUploadButton: "Upload document",
  documentsUploading: "Uploading…",
  documentsTableTitle: "Title",
  documentsTableFilename: "Filename",
  documentsTableDepartment: "Department",
  documentsTableClassification: "Classification",
  documentsTableStatus: "Status",
  documentsTableLanguage: "Language",
  documentsTablePages: "Pages",
  documentsTableUploaded: "Uploaded",
  documentsTableActions: "Actions",
  documentsEmpty: "No documents uploaded yet",
  documentsAllDepartments: "All departments (public)",
  documentsDelete: "Delete",
  documentsDeleteConfirm: "Delete this document? This cannot be undone.",
  documentsStatusProcessing: "Processing",
  documentsStatusReady: "Ready",
  documentsStatusFailed: "Failed",
  classificationPublic: "Public",
  classificationRestricted: "Restricted",
  classificationConfidential: "Confidential",

  adminTitle: "Admin overview",
  adminStatDocuments: "Total documents",
  adminStatUsers: "Total users",
  adminStatChats: "Total chats",
  adminByDepartment: "Documents by department",
  adminAuditLog: "Audit log",
  adminAuditTimestamp: "Timestamp",
  adminAuditUser: "User",
  adminAuditAction: "Action",
  adminAuditResource: "Resource",
  adminPrev: "Previous",
  adminNext: "Next",
  adminEmptyAudit: "No audit events found",

  loading: "Loading…",
  error: "Something went wrong",
  cancel: "Cancel",
  confirm: "Confirm",
};

const si: Dictionary = {
  appName: "GovAI",
  appTagline: "පුද්ගලික AI සහායක",
  poc: "සංකල්ප සත්‍යාපනය",
  pocDisclaimer: "මූලාකෘතියකි — නිල රජයේ පද්ධතියක් නොවේ",
  footerNote: "සංකල්ප සත්‍යාපනය — මෙහෙයුම් භාවිතය සඳහා නොවේ",

  navChat: "සංවාදය",
  navDocuments: "ලේඛන",
  navAdmin: "පරිපාලනය",
  logout: "පිටවීම",

  loginTitle: "GovAI වෙත පිවිසෙන්න",
  loginSubtitle: "පුද්ගලික AI සහායක — අභ්‍යන්තර පෙළපත් ප්‍රවේශය",
  emailLabel: "විද්‍යුත් තැපෑල",
  passwordLabel: "මුරපදය",
  loginButton: "පිවිසෙන්න",
  loginLoading: "පිවිසෙමින්…",
  loginError: "වැරදි විද්‍යුත් තැපෑලක් හෝ මුරපදයකි. නැවත උත්සාහ කරන්න.",

  chatNewSession: "නව සංවාදය",
  chatSessionsTitle: "සංවාද",
  chatEmptySessions: "තවම සංවාද නැත",
  chatDeleteSession: "සංවාදය මකන්න",
  chatInputPlaceholder: "රජයේ ලේඛන පිළිබඳ ප්‍රශ්නයක් අසන්න…",
  chatSend: "යවන්න",
  chatEmptyThread: "අවසර ලත් ලේඛන විමසීමට සංවාදයක් ආරම්භ කරන්න",
  chatSourcesLabel: "මූලාශ්‍ර",
  chatGroundedNotice:
    "ප්‍රතිචාර ලබා දෙනුයේ ඔබට ප්‍රවේශ වීමට අවසර ඇති ලේඛන පදනම් කරගෙන පමණි.",
  chatThinking: "සිතමින්…",
  chatPage: "පිටුව",
  chatScore: "අදාළත්වය",

  documentsTitle: "ලේඛන",
  documentsUploadTitle: "ලේඛනයක් උඩුගත කරන්න",
  documentsDropHint: "ගොනුවක් මෙහි ඇද දමන්න, නැතහොත්",
  documentsBrowse: "පිරික්සන්න",
  documentsDepartment: "දෙපාර්තමේන්තුව",
  documentsClassification: "වර්ගීකරණය",
  documentsTitleField: "මාතෘකාව",
  documentsTitleOptional: "විකල්පයි",
  documentsUploadButton: "ලේඛනය උඩුගත කරන්න",
  documentsUploading: "උඩුගත කරමින්…",
  documentsTableTitle: "මාතෘකාව",
  documentsTableFilename: "ගොනු නාමය",
  documentsTableDepartment: "දෙපාර්තමේන්තුව",
  documentsTableClassification: "වර්ගීකරණය",
  documentsTableStatus: "තත්ත්වය",
  documentsTableLanguage: "භාෂාව",
  documentsTablePages: "පිටු",
  documentsTableUploaded: "උඩුගත කළේ",
  documentsTableActions: "ක්‍රියා",
  documentsEmpty: "තවම ලේඛන උඩුගත කර නැත",
  documentsAllDepartments: "සියලුම දෙපාර්තමේන්තු (පොදු)",
  documentsDelete: "මකන්න",
  documentsDeleteConfirm: "මෙම ලේඛනය මකන්නද? මෙය අහෝසි කළ නොහැක.",
  documentsStatusProcessing: "සැකසෙමින්",
  documentsStatusReady: "සූදානම්",
  documentsStatusFailed: "අසාර්ථකයි",
  classificationPublic: "පොදු",
  classificationRestricted: "සීමිත",
  classificationConfidential: "රහස්‍ය",

  adminTitle: "පරිපාලන දළ විශ්ලේෂණය",
  adminStatDocuments: "මුළු ලේඛන ගණන",
  adminStatUsers: "මුළු පරිශීලක ගණන",
  adminStatChats: "මුළු සංවාද ගණන",
  adminByDepartment: "දෙපාර්තමේන්තුව අනුව ලේඛන",
  adminAuditLog: "විගණන සටහන",
  adminAuditTimestamp: "වේලාව",
  adminAuditUser: "පරිශීලකයා",
  adminAuditAction: "ක්‍රියාව",
  adminAuditResource: "සම්පත",
  adminPrev: "පෙර",
  adminNext: "ඊළඟ",
  adminEmptyAudit: "විගණන සිදුවීම් හමු නොවීය",

  loading: "පූරණය වෙමින්…",
  error: "යම් දෝෂයක් සිදු විය",
  cancel: "අවලංගු කරන්න",
  confirm: "තහවුරු කරන්න",
};

const ta: Dictionary = {
  appName: "GovAI",
  appTagline: "தனியார் AI உதவியாளர்",
  poc: "செயல்வழி மாதிரி",
  pocDisclaimer: "முன்மாதிரி — உத்தியோகபூர்வ அரசாங்க அமைப்பு அல்ல",
  footerNote: "செயல்வழி மாதிரி — செயல்பாட்டு பயன்பாட்டுக்கு அல்ல",

  navChat: "உரையாடல்",
  navDocuments: "ஆவணங்கள்",
  navAdmin: "நிர்வாகம்",
  logout: "வெளியேறு",

  loginTitle: "GovAI-க்கு உள்நுழையவும்",
  loginSubtitle: "தனியார் AI உதவியாளர் — உள் டெமோ அணுகல்",
  emailLabel: "மின்னஞ்சல்",
  passwordLabel: "கடவுச்சொல்",
  loginButton: "உள்நுழை",
  loginLoading: "உள்நுழைகிறது…",
  loginError: "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.",

  chatNewSession: "புதிய உரையாடல்",
  chatSessionsTitle: "உரையாடல்கள்",
  chatEmptySessions: "இதுவரை உரையாடல்கள் இல்லை",
  chatDeleteSession: "உரையாடலை நீக்கு",
  chatInputPlaceholder: "அரசாங்க ஆவணங்கள் பற்றி ஒரு கேள்வியைக் கேளுங்கள்…",
  chatSend: "அனுப்பு",
  chatEmptyThread: "அங்கீகரிக்கப்பட்ட ஆவணங்களை வினவ ஒரு உரையாடலைத் தொடங்குங்கள்",
  chatSourcesLabel: "மூலங்கள்",
  chatGroundedNotice:
    "பதில்கள் நீங்கள் அணுக அனுமதிக்கப்பட்ட ஆவணங்களை மட்டுமே அடிப்படையாகக் கொண்டவை.",
  chatThinking: "சிந்திக்கிறது…",
  chatPage: "பக்கம்",
  chatScore: "பொருத்தம்",

  documentsTitle: "ஆவணங்கள்",
  documentsUploadTitle: "ஆவணத்தை பதிவேற்றவும்",
  documentsDropHint: "ஒரு கோப்பை இங்கே இழுத்து விடவும், அல்லது",
  documentsBrowse: "உலாவு",
  documentsDepartment: "திணைக்களம்",
  documentsClassification: "வகைப்பாடு",
  documentsTitleField: "தலைப்பு",
  documentsTitleOptional: "விருப்பத்தேர்வு",
  documentsUploadButton: "ஆவணத்தை பதிவேற்று",
  documentsUploading: "பதிவேற்றுகிறது…",
  documentsTableTitle: "தலைப்பு",
  documentsTableFilename: "கோப்பு பெயர்",
  documentsTableDepartment: "திணைக்களம்",
  documentsTableClassification: "வகைப்பாடு",
  documentsTableStatus: "நிலை",
  documentsTableLanguage: "மொழி",
  documentsTablePages: "பக்கங்கள்",
  documentsTableUploaded: "பதிவேற்றப்பட்டது",
  documentsTableActions: "செயல்கள்",
  documentsEmpty: "இதுவரை ஆவணங்கள் பதிவேற்றப்படவில்லை",
  documentsAllDepartments: "அனைத்து திணைக்களங்களும் (பொது)",
  documentsDelete: "நீக்கு",
  documentsDeleteConfirm: "இந்த ஆவணத்தை நீக்கவா? இதை மீட்க முடியாது.",
  documentsStatusProcessing: "செயலாக்கத்தில்",
  documentsStatusReady: "தயார்",
  documentsStatusFailed: "தோல்வியடைந்தது",
  classificationPublic: "பொது",
  classificationRestricted: "கட்டுப்படுத்தப்பட்டது",
  classificationConfidential: "இரகசியம்",

  adminTitle: "நிர்வாக மேலோட்டம்",
  adminStatDocuments: "மொத்த ஆவணங்கள்",
  adminStatUsers: "மொத்த பயனர்கள்",
  adminStatChats: "மொத்த உரையாடல்கள்",
  adminByDepartment: "திணைக்களம் வாரியான ஆவணங்கள்",
  adminAuditLog: "தணிக்கை பதிவு",
  adminAuditTimestamp: "நேரம்",
  adminAuditUser: "பயனர்",
  adminAuditAction: "செயல்",
  adminAuditResource: "வளம்",
  adminPrev: "முந்தைய",
  adminNext: "அடுத்தது",
  adminEmptyAudit: "தணிக்கை நிகழ்வுகள் இல்லை",

  loading: "ஏற்றுகிறது…",
  error: "ஏதோ தவறு நடந்தது",
  cancel: "ரத்துசெய்",
  confirm: "உறுதிப்படுத்து",
};

export const dictionaries: Record<Locale, Dictionary> = { en, si, ta };

export const SUPPORTED_LOCALES: Locale[] = ["en", "si", "ta"];
