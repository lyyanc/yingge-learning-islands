/* 鶯歌工商・九座學習島：學校與各科內容。
   介紹文字整理自 115 學年度親職手冊「各科園地」與學校官網，要修改文字只需要改這個檔案。
   cx、cy 是島嶼在地圖上的位置（地圖大小 1100 × 900），陶瓷工程科放在正中央。 */

const SCHOOL = {
  name: '新北市立鶯歌工商',
  en: 'YINGGE VOCATIONAL HIGH SCHOOL',
  sign: 'YKVS',
  url: 'https://www.ykvs.ntpc.edu.tw/',
  motto: '知書・達理・敬業・樂群',
  storage: 'yingge-islands'
};

const ISLANDS = [
  {
    id: 'ceramic', name: '陶瓷工程科', en: 'CERAMIC ENGINEERING', icon: '🏺',
    color: '#c9744c', meadow: '#efd3b3', cx: 550, cy: 450, feature: 'pottery', chimney: true,
    tag: '拉坯・釉藥・窯燒・師徒制',
    desc: '全臺灣獨一無二的職校陶瓷科系。陶瓷專業與設計專業雙軌並進，從練土、拉坯、模製、釉藥到窯燒，三年級還有全國唯一的陶瓷師徒制教學，跟著師傅傳承傳統技藝。',
    facts: ['專屬陶工大樓，近三十間專業教室', '陶瓷手拉坯、視覺傳達設計丙級證照', '拉坯隊與茶席隊'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-89.php',
    badge: '窯火傳承徽章'
  },
  {
    id: 'crafts', name: '美術工藝科', en: 'ARTS AND CRAFTS', icon: '🎨',
    color: '#d6a03e', meadow: '#f0e2b3', cx: 225, cy: 205, feature: 'glass',
    tag: '玻璃・木工・金工・產品設計',
    desc: '以工藝實習、設計基礎、進階設計與電腦科技應用為主軸。從金工、陶工、玻璃、木工的實作，走向工藝、產品、空間與視覺傳達設計，三年級以專題完成個人作品集。',
    facts: ['玻璃工藝設備完善，並以師徒制教學', '玻璃、木、金屬、陶瓷工藝與空間設計', '每年 3 月舉辦畢業成果展'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-95.php',
    badge: '匠心工藝徽章'
  },
  {
    id: 'multimedia', name: '多媒體設計科', en: 'MULTIMEDIA DESIGN', icon: '🎬',
    color: '#9a86d4', meadow: '#ddd4f0', cx: 550, cy: 170, feature: 'film',
    tag: '動畫・遊戲・攝影・網頁',
    desc: '入學先打好手繪與設計的基礎，再走進影音、動畫與遊戲創作，搭配商業攝影、配音與編排的專業能力，培養平面影像與數位設計的多元實力。',
    facts: ['數位立體構成、網頁設計、動畫製作、商業攝影', '與廣告設計科合開設計類選修', '視覺傳達設計、印前製程、網頁設計證照'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-246.php',
    badge: '光影動畫徽章'
  },
  {
    id: 'advertising', name: '廣告設計科', en: 'ADVERTISING DESIGN', icon: '📣',
    color: '#e38aa3', meadow: '#f6d3dc', cx: 875, cy: 205, feature: 'billboard',
    tag: '平面・包裝・空間・插畫',
    desc: '善用創造力，結合攝影、手繪、商品包裝設計、電腦繪圖與室內設計，培養平面、立體與空間的設計企劃和實務能力，學習成果定期在校內展出。',
    facts: ['寒暑假作業展、科展與高三畢業成果展', '印前製程乙級、視覺傳達設計丙級證照', '進修部也設有廣告設計科'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-114.php',
    badge: '創意廣告徽章'
  },
  {
    id: 'it', name: '資訊科', en: 'INFORMATION TECHNOLOGY', icon: '💻',
    color: '#6aaed0', meadow: '#cfe7f1', cx: 900, cy: 455, feature: 'circuit',
    tag: '電子電路・電腦硬體・軟體・網路',
    desc: '以電子電路、電腦硬體、電腦軟體與電腦網路四大主軸，三年由淺入深，學會製作電路、裝修電腦、操作軟體與架設網路，二年級起還有物聯網實作、開放源碼程式設計等選修。',
    facts: ['電腦硬體裝修乙、丙級檢定合格術科試場', '微處理機、單晶片、介面電路控制實習', '進修部也設有資訊科'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-91.php',
    badge: '數位電路徽章'
  },
  {
    id: 'dataproc', name: '資料處理科', en: 'DATA PROCESSING', icon: '📊',
    color: '#5fae92', meadow: '#cde8dc', cx: 875, cy: 705, feature: 'chart',
    tag: '程式・資料庫・大數據・商業',
    desc: '升學、就業、技能、證照並重，「左手證照、右手文憑」。課程橫跨資訊應用（資料庫、程式設計、大數據分析）與商業行銷（會計、經濟、理財），並以「三師共創三贏」課程連結業界與大學。',
    facts: ['電腦軟體應用乙、丙級證照', '商管小論文、APP 與多媒體專題', '引進技專師資與業師'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-92.php',
    badge: '數據智慧徽章'
  },
  {
    id: 'japanese', name: '應用日語科', en: 'APPLIED JAPANESE', icon: '⛩️',
    color: '#d9645a', meadow: '#f6d6d6', cx: 550, cy: 740, feature: 'torii',
    tag: '日語溝通・日本文化・跨文化交流',
    desc: '強化日語說、聽、讀、寫與書信寫作，深入認識日本的文化、歷史、藝術與禮儀，並導入數位商業企劃與多媒體設計課程，培養有國際視野的跨文化溝通人才。',
    facts: ['日本文化教室', '鼓勵參加日語檢定與演講競賽', '結合數位、商業與藝術設計的跨域課程'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-257.php',
    badge: '跨文化交流徽章'
  },
  {
    id: 'retail', name: '門市服務科', en: 'RETAIL SERVICES', icon: '🏪',
    color: '#8fbd5c', meadow: '#e0eec9', cx: 225, cy: 705, feature: 'shop',
    tag: '門市・餐飲服務・生活技能・職場實習',
    desc: '前身是民國 90 年成立的綜合職能科，108 年更名。以就業為導向，培養生活能力、社會適應與基本就業技能，實作收銀台、門市作業、倉儲配送與餐飲門市服務，也有陶瓷飾品實作。',
    facts: ['每個年級兩班，共六班', '高三校外職場實習', '畢業後的就業轉銜與追蹤輔導'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-215.php',
    badge: '溫暖服務徽章'
  },
  {
    id: 'sports', name: '體育班', en: 'SPORTS PROGRAM', icon: '⚾',
    color: '#7f9fe0', meadow: '#d6e1f6', cx: 200, cy: 455, feature: 'baseball',
    tag: '棒球・拳擊・排球',
    desc: '99 學年度成立的普通科體育班，以棒球、拳擊與排球為主要項目。結合學科學習與運動體能、技術和戰術訓練，在自律與團隊合作中成長。',
    facts: ['115 年新北市青年盃拳擊錦標賽 7 金 1 銀', '新北市 114 學年度排球錦標賽第一名', '市長盃青棒錦標賽木棒組、鋁棒組第二名'],
    url: 'https://www.ykvs.ntpc.edu.tw/p/426-1000-200.php',
    badge: '運動精神徽章'
  }
];

// 島嶼之間的橋梁（數字是上面 ISLANDS 的順序，從 0 開始）：外圈八座，加上陶瓷島通往上下左右四座。
const CONNECTIONS = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1], [0, 2], [0, 4], [0, 6], [0, 8]];

const THEMES = [
  {id: 'ceramic', label: '陶藝風', icon: '🏺', caption: '拉坯・柴窯・茶席', scenes: ['wheel', 'kiln', 'tea']},
  {id: 'tech', label: '科技風', icon: '💡', caption: '機器人・無人機・感測實驗', scenes: ['robot', 'drone', 'sensors']},
  {id: 'creative', label: '創意風', icon: '🎨', caption: '畫架・STEAM・玻璃工藝', scenes: ['easel', 'steam', 'glass']},
  {id: 'human', label: '人文風', icon: '📖', caption: '閱讀・音樂・舞蹈', scenes: ['book', 'piano', 'dancer']}
];

const PRINCIPAL = {
  name: '顏龍源',
  desc: '顏龍源校長正在九座學習島之間散步。鶯歌工商以「知書、達理、敬業、樂群」為校訓，從陶瓷、工藝、設計、資訊、商管、語文、服務到運動，每一座島都是學生發光的舞台。',
  tag: '校園特別人物',
  photo: 'principal.jpg'
};

const LANDMARK = {
  name: '鶯歌石',
  en: 'LOCAL LANDMARK · YINGGE ROCK',
  desc: '相傳「鶯歌」這個地名，來自山上一塊形狀像鸚哥鳥的巨石。鶯歌是著名的陶瓷之都，鶯歌工商的建校也和在地的陶瓷文化藝術產業有很深的關係。',
  tag: '在地小彩蛋'
};
