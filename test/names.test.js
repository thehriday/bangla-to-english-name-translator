const test = require('node:test');
const assert = require('node:assert');
const { banglaNameToEnglish } = require('../src');

const cases = {
  'Full names': [
    ['শাহারিয়ার হৃদয়', 'Shahariar Hridoy'],
    ['শুভ দাশ', 'Shuvo Das'],
    ['অ্যাডভোকেট হোসনে আরা শিউলী', 'Advocate Hosne Ara Shiuli'],
    ['মোঃ আব্দুল করিম', 'Md. Abdul Karim'],
    ['তানভীর আহমেদ', 'Tanvir Ahmed'],
    ['নুসরাত জাহান', 'Nusrat Jahan'],
    ['সাকিব আল হাসান', 'Sakib Al Hasan'],
    ['মেহেদী হাসান মিরাজ', 'Mehedi Hasan Miraj'],
    ['সজীব ওয়াজেদ', 'Sajib Wajed'],
    ['আদিত্য চন্দ্র দাস', 'Aditya Chandra Das'],
    ['তন্ময় রায়', 'Tanmoy Roy'],
    ['সৈয়দ মনজুরুল ইসলাম', 'Syed Manjurul Islam'],
    ['ডাঃ অ্যানি রহমান', 'Dr. Ani Rahman'],
    ['প্রফেসর আনিসুজ্জামান', 'Professor Anisuzzaman'],
    ['কাজী নজরুল ইসলাম', 'Kazi Najrul Islam'],
    ['বিশ্বজিৎ সাহা', 'Biswajit Saha'],
  ],
  'Muslim male names': [
    ['রাকিবুল', 'Rakibul'], ['মাহমুদুল্লাহ', 'Mahmudullah'], ['মাসুদ', 'Masud'],
    ['সাব্বির', 'Sabbir'], ['মুনতাসির', 'Muntasir'], ['হাবিবুর', 'Habibur'],
    ['মিজানুর', 'Mijanur'], ['আশরাফুল', 'Ashraful'], ['শফিকুল', 'Shafikul'],
    ['কামরুল', 'Kamrul'], ['রুহুল', 'Ruhul'], ['আমিন', 'Amin'], ['শহিদুল', 'Shahidul'],
    ['মোস্তফা', 'Mostafa'], ['মোস্তাফিজুর', 'Mostafijur'], ['জসিম', 'Jasim'],
    ['নাজমুল', 'Najmul'], ['তৌহিদ', 'Touhid'], ['শাহীন', 'Shahin'], ['সুমন', 'Suman'],
    ['রাসেল', 'Rasel'], ['আরিফ', 'Arif'], ['কামাল', 'Kamal'], ['রাফি', 'Rafi'],
    ['আয়ান', 'Ayan'], ['সাগর', 'Sagar'], ['আকাশ', 'Akash'], ['পলাশ', 'Palash'],
  ],
  'Female names': [
    ['ফারহানা', 'Farhana'], ['তাসলিমা', 'Taslima'], ['শারমিন', 'Sharmin'],
    ['রুবিনা', 'Rubina'], ['মৌসুমী', 'Mousumi'], ['ঐশী', 'Oishi'], ['ঋতু', 'Ritu'],
    ['খালেদা', 'Khaleda'], ['হাসিনা', 'Hasina'], ['ইয়াসমিন', 'Yasmin'],
    ['সুমাইয়া', 'Sumaiya'], ['রিয়া', 'Riya'], ['প্রিয়াংকা', 'Priyanka'],
    ['আনিকা', 'Anika'], ['তাবাসসুম', 'Tabassum'], ['ঈশিতা', 'Ishita'],
    ['দীপ্তি', 'Dipti'], ['ইন্দ্রানী', 'Indrani'], ['চন্দনা', 'Chandana'],
    ['বর্ষা', 'Barsha'], ['মুক্তা', 'Mukta'], ['জ্যোতি', 'Jyoti'], ['পিংকি', 'Pinki'],
  ],
  'Hindu names': [
    ['সৌরভ', 'Sourav'], ['প্রদীপ', 'Pradip'], ['সঞ্জয়', 'Sanjoy'], ['অর্ণব', 'Arnab'],
    ['কৃষ্ণ', 'Krishna'], ['শান্ত', 'Shanto'], ['অনন্ত', 'Ananto'], ['প্রান্ত', 'Pranto'],
    ['স্বপন', 'Swapan'], ['সত্যজিৎ', 'Satyajit'], ['রঞ্জিত', 'Ranjit'],
    ['নির্মল', 'Nirmal'], ['উৎপল', 'Utpal'], ['অভিজিৎ', 'Ovijit'], ['তমাল', 'Tamal'],
    ['মঙ্গল', 'Mangal'], ['বিকাশ', 'Bikash'], ['প্রকাশ', 'Prakash'], ['নিলয়', 'Niloy'],
    ['গুপ্ত', 'Gupta'], ['বাপ্পী', 'Bappi'], ['শিশির', 'Shishir'],
  ],
  // One or more real names for every conjunct family (source list: Wikipedia "Bengali alphabet",
  // "Bengali consonant clusters" and bn.wikipedia "যুক্তাক্ষর").
  'Conjunct letters (যুক্তবর্ণ)': [
    ['লক্ষ্মী', 'Lakshmi'], ['রক্ষিত', 'Rakshit'], ['মুক্তা', 'Mukta'], ['ভক্ত', 'Bhakta'],
    ['শুক্লা', 'Shukla'], ['আক্কাস', 'Akkas'], ['বাক্কার', 'Bakkar'], ['অগ্নি', 'Agni'],
    ['উগ্র', 'Ugra'], ['দিগ্বিজয়', 'Digbijoy'], ['মঙ্গল', 'Mangal'], ['শঙ্কর', 'Shankar'],
    ['পঙ্কজ', 'Pankaj'], ['সঙ্গীতা', 'Sangita'], ['অঙ্কিতা', 'Ankita'], ['শঙ্খ', 'Shankha'],
    ['আকাঙ্ক্ষা', 'Akanksha'], ['সজ্জাদ', 'Sajjad'], ['উজ্জ্বল', 'Ujjwal'], ['জ্ঞানেন্দ্র', 'Gyanendra'],
    ['প্রজ্ঞা', 'Pragya'], ['সঞ্চিতা', 'Sanchita'], ['অঞ্জন', 'Anjan'], ['রঞ্জনা', 'Ranjana'],
    ['সঞ্জীব', 'Sanjib'], ['গঞ্জ', 'Ganja'], ['চট্টগ্রাম', 'Chattagram'], ['ভট্টাচার্য', 'Bhattacharya'],
    ['কণ্ঠ', 'Kantha'], ['মণ্ডল', 'Mandal'], ['ঘণ্টা', 'Ghanta'], ['দত্ত', 'Dutta'],
    ['উত্তম', 'Uttam'], ['সত্যজিৎ', 'Satyajit'], ['আত্মা', 'Atma'], ['পত্নী', 'Patni'],
    ['রত্না', 'Ratna'], ['মিত্র', 'Mitra'], ['চিত্রা', 'Chitra'], ['পবিত্র', 'Pabitra'],
    ['সত্ত্ব', 'Sattwa'], ['তত্ত্ব', 'Tattwa'], ['উদ্দিন', 'Uddin'], ['সিদ্দিক', 'Siddique'],
    ['বুদ্ধ', 'Buddha'], ['শুদ্ধ', 'Shuddha'], ['উদ্ভব', 'Udbhab'], ['পদ্ম', 'Padma'],
    ['বিদ্যা', 'Bidya'], ['চন্দ্র', 'Chandra'], ['রুদ্র', 'Rudra'], ['ইন্দ্রানী', 'Indrani'],
    ['অনন্ত', 'Ananto'], ['প্রশান্ত', 'Prashanto'], ['শান্তা', 'Shanta'], ['হেমন্ত', 'Hemanto'],
    ['আনন্দ', 'Ananda'], ['নন্দিনী', 'Nandini'], ['সন্ধ্যা', 'Sandhya'], ['বন্যা', 'Banya'],
    ['অন্নপূর্ণা', 'Annapurna'], ['মৃন্ময়', 'Mrinmoy'], ['তন্ময়', 'Tanmoy'], ['চিন্ময়', 'Chinmoy'],
    ['গুপ্ত', 'Gupta'], ['দীপ্তি', 'Dipti'], ['সুদীপ্ত', 'Sudipta'], ['বাপ্পা', 'Bappa'],
    ['প্রদীপ', 'Pradip'], ['প্রিয়া', 'Priya'], ['প্রবীর', 'Prabir'], ['সাব্বির', 'Sabbir'],
    ['আব্বাস', 'Abbas'], ['আব্দুল্লাহ', 'Abdullah'], ['শব্দ', 'Shabda'], ['লুব্ধক', 'Lubdhak'],
    ['ব্রজেন', 'Brajen'], ['ভ্রমর', 'Bhramar'], ['সম্পা', 'Sampa'], ['চম্পা', 'Champa'],
    ['অম্বর', 'Ambar'], ['শম্ভু', 'Shambhu'], ['আম্মার', 'Ammar'], ['রম্য', 'Ramya'],
    ['সৌম্য', 'Soumya'], ['তম্ময়', 'Tammoy'], ['ফাল্গুনী', 'Falguni'], ['কল্যাণ', 'Kalyan'],
    ['উল্লাহ', 'Ullah'], ['মোল্লা', 'Molla'], ['বিল্লাল', 'Billal'], ['অর্ক', 'Arka'],
    ['সর্বজিৎ', 'Sarbajit'], ['পার্বতী', 'Parbati'], ['দুর্গা', 'Durga'], ['অর্জুন', 'Arjun'],
    ['বর্ণালী', 'Barnali'], ['কার্তিক', 'Kartik'], ['পার্থ', 'Partha'], ['অর্ধেন্দু', 'Ardhendu'],
    ['ধর্ম', 'Dharma'], ['সূর্য', 'Surya'], ['আর্য', 'Arya'], ['নির্মল', 'Nirmal'],
    ['বর্ষা', 'Barsha'], ['গর্ভ', 'Garbha'], ['আশ্চর্য', 'Ashcharya'], ['পশ্চিম', 'Pashchim'],
    ['রশ্মি', 'Rashmi'], ['বিশ্বজিৎ', 'Biswajit'], ['শ্রাবণী', 'Shrabani'], ['শ্রাবন্তী', 'Shrabanti'],
    ['শ্রী', 'Shri'], ['কৃষ্ণ', 'Krishna'], ['বিষ্ণু', 'Bishnu'], ['তৃষ্ণা', 'Trishna'],
    ['অষ্টম', 'Ashtam'], ['নিষ্ঠা', 'Nishtha'], ['আস্থা', 'Astha'], ['স্বপ্না', 'Swapna'],
    ['স্বাতী', 'Swati'], ['স্মৃতি', 'Smriti'], ['স্নেহা', 'Sneha'], ['ইস্রাফিল', 'Israfil'],
    ['ইসলাম', 'Islam'], ['আস্তিক', 'Astik'], ['মোস্তফা', 'Mostafa'], ['ব্রাহ্মণ', 'Brahman'],
    ['ব্রহ্ম', 'Brahma'], ['অপরাহ্ন', 'Aparahna'], ['আহ্লাদ', 'Ahlad'], ['সহ্য', 'Sahya'],
    ['আহ্বান', 'Ahwan'], ['উৎপল', 'Utpal'], ['সৎ', 'Sat'],
    ['দিগ্বিজয়', 'Digbijoy'], ['সর্বজিৎ', 'Sarbajit'], ['জ্ঞানেন্দ্র', 'Gyanendra'],
    ['সুব্রত', 'Subrata'], ['দেবব্রত', 'Debabrata'], ['আসাদুজ্জামান', 'Asaduzzaman'], ['মনিরুজ্জামান', 'Maniruzzaman'],
    ['স্বাগতা', 'Swagata'], ['শ্যামলী', 'Shyamali'], ['শ্রাবণী', 'Shrabani'], ['ভাস্কর', 'Bhaskar'],
  ],
  'মো / মোঃ / initials': [
    ['মো শাকিল আহমেদ', 'Md. Shakil Ahmed'], ['মোঃ শাকিল আহমেদ', 'Md. Shakil Ahmed'],
    ['মো: শাকিল আহমেদ', 'Md. Shakil Ahmed'], ['মো. শাকিল আহমেদ', 'Md. Shakil Ahmed'],
    ['মোঃশাকিল আহমেদ', 'Md. Shakil Ahmed'], ['মো.শাকিল', 'Md. Shakil'],
    ['মোহাম্মদ শাকিল আহমেদ', 'Mohammad Shakil Ahmed'], ['মুহাম্মদ শাকিল আহমেদ', 'Muhammad Shakil Ahmed'],
    ['মুহম্মদ জাফর ইকবাল', 'Muhammad Jafar Ikbal'], ['শেখ মোঃ রাসেল', 'Sheikh Md. Rasel'],
    ['মোসাঃ রাবেয়া খাতুন', 'Mst. Rabeya Khatun'], ['মোছাঃ শাহনাজ বেগম', 'Mst. Shahnaj Begum'],
    ['মোসাম্মৎ নাসরিন আক্তার', 'Mosammat Nasrin Akter'], ['মোছাম্মৎ রাবেয়া', 'Mosammat Rabeya'],
    ['এস এম শাকিল', 'S M Shakil'], ['এ কে এম শাকিল', 'A K M Shakil'], ['এ.কে.এম. শাকিল', 'A.K.M. Shakil'],
    ['এস. এম. শাকিল', 'S. M. Shakil'], ['একেএম শাকিল', 'AKM Shakil'], ['ডাঃ শাকিল আহমেদ', 'Dr. Shakil Ahmed'],
    ['ডা. শাকিল', 'Dr. Shakil'], ['ড. মুহম্মদ ইউনূস', 'Dr. Muhammad Yunus'], ['সৈয়দা শাকিলা', 'Syeda Shakila'],
    ['মোস্তাক আহমেদ', 'Mostak Ahmed'], ['মোল্লা মাসুদ', 'Molla Masud'], ['মোমেন', 'Momen'],
  ],
  'Patterns found in Wikipedia names': [
    ['সালাহউদ্দিন', 'Salahuddin'], ['আমানউল্লাহ', 'Amanullah'], ['নাসিরউদ্দিন', 'Nasiruddin'],
    ['খাঁ', 'Khan'], ['চাঁদ', 'Chand'], ['হাঁসদা', 'Hansda'], ['আনোয়ার', 'Anwar'], ['দেলোয়ার', 'Delwar'],
    ['পাটোয়ারী', 'Patwari'], ['রওশন', 'Rowshan'], ['শওকত', 'Showkat'], ['হাওলাদার', 'Hawladar'],
    ['হায়দার', 'Haidar'], ['কায়সার', 'Kaisar'], ['রায়হান', 'Raihan'], ['সায়মা', 'Saima'], ['আউয়াল', 'Awal'],
    ['জয়নাল', 'Joynal'], ['নয়ন', 'Noyon'], ['আকবর', 'Akbar'], ['আজমল', 'Ajmal'], ['বরকত', 'Barkat'],
    ['অনামিকা', 'Anamika'], ['অপরাজিতা', 'Aparajita'], ['সৈকত', 'Saikat'], ['তৈমুর', 'Taimur'],
    ['অমিতাভ', 'Omitav'], ['শম্ভু', 'Shambhu'], ['হক', 'Haque'], ['দত্ত', 'Dutta'], ['চ্যাটার্জী', 'Chatterjee'],
  ],
  'Titles and surnames': [
    ['এডভোকেট', 'Advocate'], ['ইঞ্জিনিয়ার', 'Engineer'], ['চৌধুরী', 'Chowdhury'],
    ['হোসেন', 'Hossain'], ['সরকার', 'Sarkar'], ['বিশ্বাস', 'Biswas'], ['ঘোষ', 'Ghosh'],
  ],
};

// Default output: the learned dictionary gives the most common real-world spelling (from Wikidata).
const learnedCases = [
    ['শাহারিয়ার হৃদয়', 'Shahariar Hridoy'], ['মো শাকিল আহমেদ', 'Md. Shakil Ahmed'], ['শুভ দাশ', 'Shuvo Das'], ['একেএম শাকিল', 'AKM Shakil'],
    ['পার্বতী', 'Parbati'], ['সজীব ওয়াজেদ', 'Sajib Wazed'], ['তন্ময় রায়', 'Tonmoy Roy'], ['ডাঃ অ্যানি রহমান', 'Dr. Annie Rahman'],
    ['কাজী নজরুল ইসলাম', 'Kazi Nazrul Islam'], ['মিজানুর', 'Mizanur'], ['শফিকুল', 'Shafiqul'], ['মোস্তাফিজুর', 'Mostafizur'],
    ['জসিম', 'Jashim'], ['নাজমুল', 'Nazmul'], ['শাহীন', 'Shaheen'], ['সুমন', 'Sumon'],
    ['সাগর', 'Sagor'], ['মৌসুমী', 'Moushumi'], ['সঞ্জয়', 'Sanjoy'], ['অনন্ত', 'Ananta'],
    ['রঞ্জিত', 'Ranjit'], ['অভিজিৎ', 'Avijit'], ['বাপ্পী', 'Bappy'], ['লক্ষ্মী', 'Lakshmi'],
    ['শঙ্কর', 'Shankar'], ['উজ্জ্বল', 'Uzzal'], ['মণ্ডল', 'Mondal'], ['প্রশান্ত', 'Prashanta'],
    ['হেমন্ত', 'Hemanta'], ['বন্যা', 'Banya'], ['তন্ময়', 'Tonmoy'], ['সুদীপ্ত', 'Sudipto'],
    ['ব্রজেন', 'Brojen'], ['মোল্লা', 'Mollah'], ['অর্ক', 'Arka'], ['কার্তিক', 'Kartik'],
    ['সূর্য', 'Surya'], ['শ্রাবন্তী', 'Shrabanti'], ['শ্রী', 'Shri'], ['ব্রাহ্মণ', 'Brahmin'],
    ['মনিরুজ্জামান', 'Moniruzzaman'], ['শ্যামলী', 'Shyamali'], ['মুহম্মদ জাফর ইকবাল', 'Muhammad Zafar Iqbal'], ['মোছাঃ শাহনাজ বেগম', 'Mst. Shahnaz Begum'],
    ['মোল্লা মাসুদ', 'Mollah Masud'], ['পাটোয়ারী', 'Patwary'], ['শওকত', 'Shawkat'], ['হাওলাদার', 'Howlader'],
    ['হায়দার', 'Haider'], ['কায়সার', 'Kaiser'], ['সায়মা', 'Sayema'], ['নয়ন', 'Nayan'],
    ['আজমল', 'Azmal'],
];

function check(pairs, options) {
  const failures = pairs
    .map(([bn, expected]) => ({ bn, expected, actual: banglaNameToEnglish(bn, options) }))
    .filter((r) => r.actual !== r.expected);
  assert.deepStrictEqual(failures, []);
}

// The groups above test the rules and curated list on their own, so they keep guarding the
// conjunct/vowel handling however the learned dictionary changes.
for (const [group, pairs] of Object.entries(cases)) {
  test(`${group} (rules + curated)`, () => check(pairs, { useLearnedDictionary: false }));
}

test('Real-world spellings (default, with learned dictionary)', () => check(learnedCases));

// Fixes found by testing on 2.6 million everyday name records and complex real names.
const robustnessCases = [
  // Punctuation, invisible joiners and mixed text around names
  ['শুভ দাশ।', 'Shuvo Das.'], ['দাশ, শুভ', 'Das, Shuvo'], ['শুভ (দাশ)', 'Shuvo (Das)'], ['"শুভ দাশ"', '"Shuvo Das"'],
  ['শুভ।দাশ', 'Shuvo. Das'], ['শাকি\u200Cল আহমেদ', 'Shakil Ahmed'], ['Md. শাকিল Ahmed', 'Md. Shakil Ahmed'],
  ['উর-রহমান', 'Ur-Rahman'], ['মোঃ মোস্তাফিজুর রহমান (রনি)', 'Md. Mostafizur Rahman (Rony)'],
  // মহঃ / এমডি abbreviations
  ['মহঃ রফিক', 'Md. Rafiq'], ['মহ রফিক', 'Md. Rafiq'], ['এমডি রফিক', 'Md. Rafiq'], ['মহম্মদ', 'Mohammad'],
  // Old spelling: doubled consonant after reph
  ['মুখার্জ্জী', 'Mukherjee'], ['ব্যানার্জ্জী', 'Banerjee'], ['চ্যাটার্জ্জী', 'Chatterjee'], ['ভট্টাচার্য্য', 'Bhattacharya'],
  // ঁ and ঞ
  ['গরাঁই', 'Garai'], ['গঁরাই', 'Garai'], ['খাঁ', 'Khan'], ['চাঁদ', 'Chand'], ['ভুইঞা', 'Bhuiya'],
  // Compound names English writes as two words
  ['প্রবোধচন্দ্র বাগচী', 'Prabodh Chandra Bagchi'], ['জগদীশচন্দ্র বসু', 'Jagadish Chandra Basu'],
  ['দিলীপকুমার রায়', 'Dilip Kumar Roy'], ['রবীন্দ্রনাথ ঠাকুর', 'Rabindranath Thakur'],
  // Christian names
  ['মাইকেল মধুসূদন দত্ত', 'Michael Madhusudan Dutta'], ['জন গোমেজ', 'John Gomes'],
  // Typos in a single record must not be learned
  ['মাশরাফি বিন মর্তুজা', 'Mashrafi Bin Martuja'],
  // Complex full names
  ['ডাঃ মোঃ শফিকুল ইসলাম চৌধুরী', 'Dr. Md. Shafiqul Islam Chowdhury'],
  ['ইঞ্জিঃ এ.কে.এম. ফজলুল করিম', 'Engr. A.K.M. Fazlul Karim'],
  ['আলহাজ্ব মোঃ আবুল কালাম আজাদ', 'Alhaj Md. Abul Kalam Azad'], ['শেখ মুজিবুর রহমান', 'Sheikh Mujibur Rahman'],
  ['শ্রীমতি', 'Shrimati'], ['লক্ষী', 'Lakshmi'], ['মন্ডল', 'Mondal'],
];

test('Robustness and complex names', () => check(robustnessCases));

// Bangladeshi spelling style is the default: i/u (not ee/oo), v/b (not bh/v), sh for শ, -oy endings,
// and "o" for the inherent vowel where Bangladeshis write it (Ovi, Shanto, Moni, Robi, Sumon).
const bangladeshiCases = [
  ['মুহাম্মদ অভি', 'Muhammad Ovi'], ['অভি', 'Ovi'], ['নাজমুল হোসেন শান্ত', 'Nazmul Hossain Shanto'],
  ['মণি', 'Moni'], ['মনি', 'Moni'], ['রবি', 'Robi'], ['সুজন', 'Sujon'], ['সুমন', 'Sumon'], ['সাগর', 'Sagor'],
  ['সঞ্জয়', 'Sanjoy'], ['বিজয়', 'Bijoy'], ['অজয়', 'Ajoy'], ['বিবেক', 'Bibek'], ['বিপ্লব', 'Biplob'],
  ['জিনাত', 'Zinat'], ['শিশির', 'Shishir'], ['পীর', 'Pir'], ['সায়েম', 'Sayem'], ['দীপক', 'Dipak'], ['সীমা', 'Sima'],
  ['খাতুন', 'Khatun'], ['তাপস', 'Taposh'], ['হৃদয়', 'Hridoy'], ['জয়', 'Joy'], ['রনি', 'Rony'], ['প্রান্ত', 'Pranto'],
];

test('Bangladeshi spelling pattern (default)', () => check(bangladeshiCases));

test('Custom dictionary wins over everything', () => {
  assert.strictEqual(banglaNameToEnglish('শাহারিয়ার হৃদয়', { dictionary: { 'হৃদয়': 'Hriday' } }), 'Shahariar Hriday');
  assert.strictEqual(banglaNameToEnglish('মোঃ হক', { dictionary: { 'হক': 'Huq' } }), 'Md. Huq');
});

test('Input handling', () => {
  assert.strictEqual(banglaNameToEnglish(''), '');
  assert.strictEqual(banglaNameToEnglish('   শুভ   দাশ  '), 'Shuvo Das');
  assert.strictEqual(banglaNameToEnglish('শুভ দাশ'.normalize('NFD')), 'Shuvo Das');
  assert.throws(() => banglaNameToEnglish(null), TypeError);
});

test('Learned dictionary is clean', () => {
  const learned = require('../src/learned-dictionary.json');
  const { INITIALS, ABBREVIATIONS } = require('../src/dictionary');
  for (const [bn, en] of Object.entries(learned)) {
    assert.match(bn, /^[\u0980-\u09FF-]+$/, `key "${bn}" is not a Bangla word`);
    assert.match(en, /^[A-Z][a-z'-]+$/, `"${bn}" -> "${en}" is not a Title Case word`);
    assert.ok(!INITIALS[bn] && !ABBREVIATIONS[bn], `"${bn}" is an initial/abbreviation and must not be learned`);
  }
});
