'use strict';

// Hand-picked conventional spellings. These win over the learned dictionary.
// Common name words with their conventional English spellings.
const CURATED_DICTIONARY = {
  'মোহাম্মদ': 'Mohammad', 'মোহাম্মাদ': 'Mohammad', 'মুহাম্মদ': 'Muhammad',
  'মুহম্মদ': 'Muhammad', 'মহম্মদ': 'Mohammad', 'সৈয়দা': 'Syeda', 'এমডি': 'Md.',
  'মোসাম্মৎ': 'Mosammat', 'মোসাম্মাৎ': 'Mosammat', 'মোছাম্মৎ': 'Mosammat', 'মোছাম্মাৎ': 'Mosammat',
  'আব্দুল': 'Abdul', 'আবদুল': 'Abdul', 'আব্দুর': 'Abdur', 'আবদুর': 'Abdur',
  'আহমেদ': 'Ahmed', 'আহমদ': 'Ahmad', 'আলী': 'Ali', 'আলি': 'Ali',
  'রহমান': 'Rahman', 'রাহমান': 'Rahman', 'ইসলাম': 'Islam',
  'হোসেন': 'Hossain', 'হোসাইন': 'Hossain', 'হাসান': 'Hasan',
  'উদ্দিন': 'Uddin', 'উদ্দীন': 'Uddin', 'খান': 'Khan', 'শেখ': 'Sheikh',
  'চৌধুরী': 'Chowdhury', 'চৌধুরি': 'Chowdhury', 'সরকার': 'Sarkar',
  'তালুকদার': 'Talukder', 'মজুমদার': 'Majumdar', 'ভূঁইয়া': 'Bhuiyan', 'ভুঁইয়া': 'Bhuiyan',
  'মিয়া': 'Mia', 'মিঞা': 'Mia', 'আক্তার': 'Akter', 'আখতার': 'Akhter',
  'খাতুন': 'Khatun', 'বেগম': 'Begum', 'সুলতানা': 'Sultana', 'জাহান': 'Jahan',
  'নূর': 'Noor', 'নুর': 'Noor', 'কবির': 'Kabir', 'করিম': 'Karim', 'রহিম': 'Rahim',
  'ফাতেমা': 'Fatema', 'ফাতিমা': 'Fatima', 'আয়েশা': 'Ayesha',
  'রায়': 'Roy', 'দাস': 'Das', 'দে': 'Dey', 'কুমার': 'Kumar', 'চক্রবর্তী': 'Chakraborty',
  'ঠাকুর': 'Thakur', 'হক': 'Haque', 'গুহ': 'Guha', 'দত্ত': 'Dutta', 'মল্লিক': 'Mallick',
  'খন্দকার': 'Khandaker', 'খোন্দকার': 'Khandaker', 'সিদ্দিক': 'Siddique', 'সিদ্দিকী': 'Siddiqui',
  'চ্যাটার্জি': 'Chatterjee', 'চ্যাটার্জী': 'Chatterjee', 'ব্যানার্জি': 'Banerjee', 'ব্যানার্জী': 'Banerjee',
  'মুখার্জি': 'Mukherjee', 'মুখার্জী': 'Mukherjee', 'ভট্টাচার্য': 'Bhattacharya', 'ভট্টাচার্য্য': 'Bhattacharya', 'বিশ্বাস': 'Biswas', 'দাশ': 'Das', 'ঘোষ': 'Ghosh', 'সৈয়দ': 'Syed', 'কাজী': 'Kazi', 'বসু': 'Basu', 'সেন': 'Sen',
  'শাহরিয়ার': 'Shahriar', 'শাহারিয়ার': 'Shahariar', 'অভি': 'Ovi',

  // Christian and English names written in Bangla: sound rules cannot recover English spelling.
  'মাইকেল': 'Michael', 'যোসেফ': 'Joseph', 'জোসেফ': 'Joseph', 'পল': 'Paul', 'ডেভিড': 'David',
  'ফ্রান্সিস': 'Francis', 'ম্যাথিউ': 'Matthew', 'থমাস': 'Thomas', 'টমাস': 'Thomas', 'জেমস': 'James',
  'রবার্ট': 'Robert', 'রিচার্ড': 'Richard', 'উইলিয়াম': 'William', 'জর্জ': 'George', 'এডওয়ার্ড': 'Edward',
  'অ্যান্থনি': 'Anthony', 'এন্থনি': 'Anthony', 'ক্রিস্টোফার': 'Christopher', 'স্টিফেন': 'Stephen',
  'প্যাট্রিক': 'Patrick', 'ড্যানিয়েল': 'Daniel', 'ফিলিপ': 'Philip', 'অ্যান্ড্রু': 'Andrew', 'এন্ড্রু': 'Andrew',
  'জন': 'John', 'পিটার': 'Peter', 'মেরি': 'Mary', 'মারিয়া': 'Maria', 'এলিজাবেথ': 'Elizabeth',
  'ক্যাথরিন': 'Catherine', 'মার্গারেট': 'Margaret', 'ভেরোনিকা': 'Veronica', 'ক্লারা': 'Clara',
  'গোমেজ': 'Gomes', 'গোমেস': 'Gomes', 'কস্তা': 'Costa', 'ডি\'কস্তা': "D'Costa", 'ডিকস্তা': "D'Costa",
  'রোজারিও': 'Rozario', 'কোড়াইয়া': 'Corraya', 'পালমা': 'Palma', 'ক্রুশ': 'Cruze',

  // Titles and prefixes (mostly English words written in Bangla).
  'অ্যাডভোকেট': 'Advocate', 'এ্যাডভোকেট': 'Advocate', 'এডভোকেট': 'Advocate', 'ডক্টর': 'Dr.',
  'প্রফেসর': 'Professor', 'অধ্যাপক': 'Professor', 'ইঞ্জিনিয়ার': 'Engineer', 'ব্যারিস্টার': 'Barrister', 'মেজর': 'Major',
  'ক্যাপ্টেন': 'Captain', 'কর্নেল': 'Colonel', 'জেনারেল': 'General',
  'মাওলানা': 'Maulana', 'হাজী': 'Haji', 'আলহাজ্ব': 'Alhaj', 'আলহাজ': 'Alhaj',
  'শহীদ': 'Shahid', 'মিসেস': 'Mrs.', 'মিস': 'Miss', 'মিস্টার': 'Mr.', 'জনাব': 'Janab',
};

// Abbreviated prefixes, written with ঃ, :, . or (for the first group) nothing: মোঃ, মো:, মো., মো.
const ABBREVIATIONS = {
  'মো': 'Md.', 'মোসা': 'Mst.', 'মোছা': 'Mst.', 'মহ': 'Md.',
  'মোহা': 'Md.', 'ডা': 'Dr.', 'ড': 'Dr.', 'প্রো': 'Prof.', 'প্রফ': 'Prof.',
  'ইঞ্জি': 'Engr.', 'অ্যাড': 'Adv.', 'এড': 'Adv.',
};
const BARE_ABBREVIATIONS = new Set(['মো', 'মোসা', 'মোছা', 'মহ']); // never real names, so no mark needed

// English letters as they are written in Bangla, for initials like "এ কে এম" -> "A K M".
const INITIALS = {
  'এ': 'A', 'বি': 'B', 'সি': 'C', 'ডি': 'D', 'ই': 'E', 'এফ': 'F', 'জি': 'G', 'এইচ': 'H',
  'আই': 'I', 'জে': 'J', 'কে': 'K', 'এল': 'L', 'এম': 'M', 'এন': 'N', 'ও': 'O', 'পি': 'P',
  'কিউ': 'Q', 'আর': 'R', 'এস': 'S', 'টি': 'T', 'ইউ': 'U', 'ভি': 'V', 'ডব্লিউ': 'W',
  'ডাব্লিউ': 'W', 'এক্স': 'X', 'ওয়াই': 'Y', 'জেড': 'Z',
};

module.exports = { CURATED_DICTIONARY, ABBREVIATIONS, BARE_ABBREVIATIONS, INITIALS };
