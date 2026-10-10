// Toàn bộ nội dung chữ của trang, lấy từ "Kế hoạch tổ chức cuộc thi IS NextGen Manager final".
// Sửa chữ, số liệu, mốc thời gian tại đây; không cần đụng tới component.
import type { IconName } from "@/components/Icon";

export const site = {
  name: "NextGen Manager Challenge 2026",
  viName: "Nhà Quản trị trong Kỷ nguyên mới",
  theme: "Chân dung Nhà quản trị trong kỷ nguyên AI",
  themeEn: "The Manager in the AI Era",
  heroTitle: "Nhà quản trị trong kỷ nguyên AI",
  slogan: ["Tư duy mới", "Kỹ năng mới", "Tạo giá trị thật"],
  tagline: "Kiến tạo thế hệ quản trị tiếp theo",
  hashtag: "#NextGenManager",
  // TODO(BTC): thay bằng hạn đăng ký chính thức. Vòng 1 diễn ra tuần 2/11/2026.
  registrationDeadline: "2026-11-01T23:59:00+07:00",
  registrationDeadlineLabel: "23:59, 01/11/2026 (dự kiến)",
  // Mỗi phần tử là một cụm không bị ngắt dòng giữa chừng
  address: {
    unit: ["Khoa Kinh tế và Quản lý,", "Trường Quốc tế - ĐHQGHN"],
    street: ["Toà D2, ĐHQGHN,", "144 Xuân Thuỷ,", "Cầu Giấy, Hà Nội"],
  },
  // TODO(BTC): điền thông tin liên hệ và mạng xã hội thật; để trống thì ẩn.
  contact: {
    email: "nextgen@vnuis.edu.vn",
    phone: "0962 132 535",
    // Người trực hotline
    hotlineName: "Đào Công Tuấn",
    hotlineEmail: "tuandc@vnu.edu.vn",
    fanpage: "https://www.facebook.com/profile.php?id=61595115537350",
    sponsorDeck: "",
  },
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61595115537350",
    linkedin: "",
    youtube: "",
    tiktok: "",
  },
  // TODO(BTC): link video giới thiệu (YouTube); để trống thì nút phát hiện "sắp ra mắt".
  videoUrl: "",
};

export const nav = [
  { href: "/#top", label: "Trang chủ", id: "top" },
  { href: "/#gioi-thieu", label: "Cuộc thi", id: "gioi-thieu" },
  { href: "/#trai-nghiem", label: "Trải nghiệm", id: "trai-nghiem" },
  { href: "/#lo-trinh", label: "Lộ trình", id: "lo-trinh" },
  { href: "/#giai-thuong", label: "Giải thưởng", id: "giai-thuong" },
  { href: "/the-le/", label: "Thể lệ", id: "the-le" },
];

export const hero = {
  eyebrow: "Cuộc thi quản trị thực chiến · Mùa 1",
  title: ["NEXTGEN", "MANAGER 2026"],
  theme: "The Manager in the AI Era",
  tagline: "Nhà quản trị trong kỷ nguyên AI · Kiến tạo thế hệ quản trị tiếp theo",
};

// Mùa 1 chưa có số liệu các mùa trước, nên nêu quyền lợi nổi bật thay cho con số
export const heroStats: { icon: IconName; value: string; label: string; tone?: "sky" | "gold" }[] = [
  { icon: "briefcase", value: "Thực tập", label: "tại doanh nghiệp đồng hành" },
  { icon: "handshake", value: "Kết nối", label: "với chuyên gia và lãnh đạo doanh nghiệp" },
  { icon: "fileChart", value: "04 vòng", label: "thi thực chiến, chấm theo năng lực" },
  { icon: "users", value: "GS · PGS · TS", label: "và đại diện doanh nghiệp đồng hành" },
];

export const about = {
  title: ["Cuộc thi Quản trị Thực chiến Đầu tiên", "ứng dụng ", "Khung Năng lực Hành vi & Trí tuệ Nhân tạo (AI)"],
  body: "NextGen Manager 2026 do Khoa Kinh tế và Quản lý, Trường Quốc tế (ĐHQGHN) tổ chức là sân chơi học thuật dành cho sinh viên toàn quốc. Thông qua hệ thống bốn vòng thi từ kiểm tra năng lực, thảo luận nhóm thực chiến cho đến giải bài toán quản trị trực tiếp từ doanh nghiệp đồng hành, cuộc thi tạo môi trường để bạn rèn luyện tư duy hệ thống, năng lực ra quyết định trong điều kiện thiếu thông tin và bản lĩnh ứng dụng trí tuệ nhân tạo (AI) vào quản trị. Đây cũng là cơ hội để bạn nhận Báo cáo năng lực cá nhân, tham gia chuyến quan sát thực tế tại tập đoàn lớn và mở rộng cánh cửa nghề nghiệp tại các doanh nghiệp hàng đầu.",
  features: [
    {
      icon: "brain" as IconName,
      title: "Tư duy chiến lược trong kỷ nguyên AI",
      body: "Tiếp cận tư duy quản trị hiện đại: dùng AI làm công cụ nhưng vẫn giữ phán đoán của riêng mình.",
      tone: "bg-blue-50 text-brand",
    },
    {
      icon: "lightbulb" as IconName,
      title: "Trải nghiệm thực tiễn, đánh giá năng lực",
      body: "Giải tình huống mô phỏng và bài toán thật của doanh nghiệp, chấm theo khung năng lực hành vi.",
      tone: "bg-orange-50 text-orange",
    },
    {
      icon: "usersGroup" as IconName,
      title: "Kết nối cộng đồng sinh viên toàn quốc",
      body: "Làm việc nhóm cùng sinh viên nhiều trường, nhiều ngành và sinh viên quốc tế.",
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: "trophy" as IconName,
      title: "Cơ hội nghề nghiệp rộng mở",
      body: "Tiếp cận doanh nghiệp đồng hành, suất thực tập và vé vào thẳng vòng phỏng vấn cuối.",
      tone: "bg-amber-50 text-amber-600",
    },
  ],
};

// Thẻ "Những trải nghiệm chỉ có": tone peach/blue xen kẽ, icon 3D exp-icon-1..3, exp-icon-4-globe
export const perks = {
  eyebrow: "Về cuộc thi",
  title: "Những trải nghiệm chỉ có tại NextGen Manager",
  lead: "Cuộc thi quản trị thực chiến giúp bạn phát triển năng lực toàn diện, kết nối sâu rộng và tạo giá trị thật cho sự nghiệp tương lai.",
  items: [
    { title: "Thi thực chiến", body: "Giải tình huống thật của doanh nghiệp, chấm theo Khung năng lực hành vi chuẩn hoá: 06 nhóm năng lực, 05 mức hành vi.", href: "/the-le/" },
    { title: "Thực tập & cơ hội nghề nghiệp", body: "Suất thực tập và vé vào thẳng vòng phỏng vấn cuối chương trình Management Trainee.", href: "/#giai-thuong" },
    { title: "Kết nối mạng lưới", body: "Gặp gỡ doanh nghiệp, giám khảo và cộng đồng sinh viên toàn quốc.", href: "/#trai-nghiem" },
    { title: "Phát triển toàn diện", body: "Nhận Báo cáo năng lực cá nhân, rèn tư duy hệ thống và bản lĩnh ứng dụng AI.", href: "/the-le/" },
  ],
};

// "Hành trình trải nghiệm": các hoạt động nổi bật trong mùa giải
export const journey = {
  title: "Hành trình trải nghiệm",
  more: "Xem toàn bộ thể lệ",
  items: [
    { title: "Thảo luận nhóm không người dẫn", body: "Nhóm 06 người cùng giải một tình huống có lợi ích xung đột, không ai được chỉ định làm trưởng nhóm.", image: "/images/photos/hl-lgd.webp", href: "/the-le/#vong-2" },
    { title: "Giải bài toán quản trị cùng AI", body: "Xử lý hộp thư của nhà quản lý: được dùng AI nhưng phải giải trình từng quyết định.", image: "/images/photos/round-case.webp", href: "/the-le/#vong-3" },
    { title: "Tham quan doanh nghiệp & toạ đàm", body: "Quan sát môi trường làm việc thực tế và học hỏi trực tiếp từ nhà quản lý.", image: "/images/photos/hl-trip.webp", href: "/the-le/#ben-le" },
    { title: "Kết nối cộng đồng nhân tài", body: "Tiệc tối Networking cùng doanh nghiệp, giám khảo và cựu sinh viên.", image: "/images/photos/hl-dinner.webp", href: "/the-le/#ben-le" },
  ],
};

export const themeSection = {
  body: "Trí tuệ nhân tạo (AI) đang tái định hình phương thức vận hành của mọi doanh nghiệp. Cuộc thi NextGen Manager 2026 đặt ra thách thức tìm kiếm và bồi dưỡng thế hệ nhà quản trị trẻ có tư duy hệ thống, năng lực ra quyết định chính xác trong điều kiện thiếu thông tin, và bản lĩnh ứng dụng AI làm công cụ hỗ trợ đắc lực nhưng vẫn giữ vững phán đoán độc lập.",
  points: ["Ứng dụng AI trong quản trị", "Giải quyết vấn đề thực tiễn từ doanh nghiệp", "Đề xuất giải pháp sáng tạo, bền vững và khả thi", "Sẵn sàng dẫn dắt trong môi trường toàn cầu"],
  quote: "Không chỉ là một cuộc thi, mà còn là hành trình khám phá và khẳng định bản thân.",
};

export const rounds = [
  {
    no: "01",
    step: "Vòng Đơn",
    short: "Hồ sơ, video & bài test",
    name: "Hồ sơ và kiểm tra năng lực",
    format: "Cá nhân · Trực tuyến",
    duration: "60 phút",
    body: "Nộp hồ sơ trực tuyến kèm video giới thiệu tối đa 02 phút trả lời một câu hỏi tình huống quản trị do Ban Tổ chức công bố và 01 ảnh cá nhân. Làm bài kiểm tra trực tuyến gồm tư duy số liệu, tư duy logic và kiến thức quản trị nền tảng; thí sinh ngoài Trường dự thi từ xa có giám sát.",
    funnel: "250-300 → 40 thí sinh",
    gradient: "from-[#2f6bf0] to-[#1d47c8]",
  },
  {
    no: "02",
    step: "Vòng Sơ loại",
    short: "Thảo luận nhóm",
    name: "Thảo luận nhóm không có người dẫn",
    format: "Nhóm 06 người",
    duration: "40 phút/nhóm",
    body: "Nhóm sáu thí sinh nhận một tình huống có xung đột lợi ích, không ai được chỉ định làm nhóm trưởng, và phải đi đến quyết định chung. Giám khảo quan sát và chấm theo khung hành vi.",
    funnel: "40 → 16 thí sinh",
    gradient: "from-[#1d3f9a] to-[#2a5bd6]",
  },
  {
    no: "03",
    step: "Vòng Bán kết",
    short: "Xử lý tình huống điều hành",
    name: "Xử lý tình huống điều hành",
    format: "Cá nhân · Được dùng AI",
    duration: "90 phút làm bài + 15 phút bảo vệ",
    body: "Mô phỏng hộp thư công việc của nhà quản lý: nhiều vấn đề đến cùng lúc, nguồn lực hạn chế. Thí sinh sắp thứ tự ưu tiên, ra quyết định và giải trình bằng văn bản, sau đó bảo vệ trước giám khảo.",
    funnel: "16 → 12 thí sinh",
    gradient: "from-[#0e7c8c] to-[#1f63ae]",
  },
  {
    no: "04",
    step: "Vòng Chung kết",
    short: "Thuyết trình & Tranh biện",
    name: "Chung kết",
    format: "03 đội × 04 người · Được dùng AI",
    duration: "20 phút/đội",
    body: "Ghép 12 thí sinh thành 03 đội, giải bài toán quản trị thật của doanh nghiệp đồng hành trong 05 ngày; trình bày và phản biện trước hội đồng, có phần trình bày bằng tiếng Anh.",
    funnel: "12 thí sinh · 03 đội",
    gradient: "from-[#f2711c] to-[#e0313e]",
  },
];

export const roundIcons: IconName[] = ["fileText", "messages", "inbox", "presentation"];

export const roundsIntro: string =
  "Mỗi vòng thi là một thử thách khác nhau, giúp bạn phát triển từ tư duy đến kỹ năng thực chiến dưới sự đánh giá của giảng viên và doanh nghiệp.";

export const values = {
  eyebrow: "Đầu tư cho tương lai",
  title: ["Sẵn sàng năng lực –", "Dẫn lối sự nghiệp"],
  body: "Tổng giá trị giải thưởng 14.500.000 đồng, cùng suất thực tập, vé vào thẳng vòng phỏng vấn cuối và Báo cáo năng lực cá nhân cho thí sinh vòng trong.",
  items: [
    { icon: "fileChart" as IconName, title: "Kiến thức thực tiễn", body: "Từ chuyên gia và doanh nghiệp" },
    { icon: "briefcase" as IconName, title: "Thực tập & dự án thật", body: "Trải nghiệm môi trường thực tế" },
    { icon: "handshake" as IconName, title: "Kết nối mạng lưới", body: "Với cộng đồng nhân tài & doanh nghiệp" },
    { icon: "rocket" as IconName, title: "Cơ hội nghề nghiệp", body: "Mở rộng cánh cửa sự nghiệp tương lai" },
  ],
};

export const personas = [
  {
    image: "/images/photos/persona-1.webp",
    title: "Tư duy phân tích và ra quyết định",
    body: "Xác định đúng vấn đề cốt lõi, dùng dữ liệu, lập luận có căn cứ và dám quyết định khi thông tin chưa đầy đủ.",
  },
  {
    image: "/images/photos/persona-2.webp",
    title: "Tư duy hệ thống và sắp xếp ưu tiên",
    body: "Nhìn ra quan hệ nhân quả, phân bổ nguồn lực hạn chế, biết việc gì làm trước và giải thích được vì sao.",
  },
  {
    image: "/images/photos/persona-3.webp",
    title: "Lãnh đạo và tạo ảnh hưởng",
    body: "Đề xuất hướng đi, thuyết phục người khác, xử lý bất đồng và chịu trách nhiệm về quyết định của mình.",
  },
  {
    image: "/images/photos/persona-4.webp",
    title: "Hợp tác và giao tiếp",
    body: "Lắng nghe, xây dựng trên ý kiến người khác, đóng góp vào kết quả chung thay vì tranh phần nói.",
  },
  {
    image: "/images/photos/persona-5.webp",
    title: "Đạo đức và trách nhiệm",
    body: "Cân nhắc lợi ích các bên liên quan, chính trực trong đề xuất, nhận diện được rủi ro đạo đức.",
  },
  {
    image: "/images/photos/persona-6.webp",
    title: "Trình bày và ngôn ngữ",
    body: "Cấu trúc thông điệp rõ ràng, thuyết phục bằng lời và hình ảnh, trình bày được bằng tiếng Anh.",
  },
];

// until: hết ngày của mốc, dùng để đánh dấu giai đoạn đang diễn ra
export const milestones: { date: string; title: string; icon: IconName; tone: "orange" | "blue" | "red" | "gold"; until: string }[] = [
  { date: "10 - 01.11.2026", title: "Mở đơn đăng ký", icon: "fileText", tone: "orange", until: "2026-11-01T23:59:00+07:00" },
  { date: "Tuần 4 · 11/2026", title: "Vòng Sơ loại", icon: "messages", tone: "blue", until: "2026-11-29T23:59:00+07:00" },
  { date: "Tuần 2 · 12/2026", title: "Vòng Bán kết", icon: "inbox", tone: "red", until: "2026-12-13T23:59:00+07:00" },
  { date: "Tuần 4 · 12/2026", title: "Vòng Chung kết", icon: "trophy", tone: "gold", until: "2026-12-27T23:59:00+07:00" },
];

// Lộ trình đầy đủ, hiển thị ở trang Thể lệ
export const timeline = [
  { date: "Tuần 2 · 10/2026", title: "Lễ phát động", body: "Mở cổng đăng ký trực tuyến" },
  { date: "Tuần 4 · 10/2026", title: "Ngày hội thông tin", body: "Giới thiệu thể thức, giải đáp thắc mắc, chia sẻ từ doanh nghiệp" },
  { date: "Tuần 2 · 11/2026", title: "Vòng Đơn", body: "Thi trực tuyến, công bố kết quả trong 05 ngày" },
  { date: "Tuần 4 · 11/2026", title: "Vòng Sơ loại", body: "Thảo luận nhóm theo ca, mỗi ca 06 thí sinh" },
  { date: "Tuần 1 · 12/2026", title: "Business Trip", body: "16 thí sinh tham quan một tập đoàn hàng đầu" },
  { date: "Tuần 2 · 12/2026", title: "Vòng Bán kết", body: "Làm bài, bảo vệ; công bố 12 thí sinh và ghép đội" },
  { date: "Tuần 3 · 12/2026", title: "Kết nối & bình chọn", body: "Tiệc tối kết nối, giao đề chung kết, bình chọn đội yêu thích" },
  { date: "Tuần 4 · 12/2026", title: "Vòng Chung kết", body: "Trình bày, phản biện, công bố kết quả và trao giải" },
  { date: "01/2027", title: "Báo cáo năng lực", body: "Gửi báo cáo cá nhân tới thí sinh từ Vòng Sơ loại" },
];

export const prizeTotal: string = "14.500.000 đồng";

export const prizes: { rank: string; qty: string; amount: string; perks: string[]; icon: IconName; featured?: boolean }[] = [
  {
    rank: "Quán quân",
    qty: "Giải Nhất · 01 đội",
    amount: "5.000.000đ",
    perks: ["Vé vào thẳng vòng phỏng vấn cuối", "Chứng nhận", "Xác nhận của doanh nghiệp"],
    icon: "crown",
    featured: true,
  },
  { rank: "Á quân", qty: "Giải Nhì · 01 đội", amount: "3.000.000đ", perks: ["Chứng nhận", "Xác nhận của doanh nghiệp"], icon: "medal" },
  { rank: "Top 3", qty: "Giải Ba · 01 đội", amount: "2.000.000đ", perks: ["Chứng nhận", "Xác nhận của doanh nghiệp"], icon: "award" },
  { rank: "Cá nhân xuất sắc", qty: "01 thí sinh", amount: "1.500.000đ", perks: ["01 suất thực tập", "Kỷ niệm chương"], icon: "star" },
];

export const minorPrizes: string =
  "Ngoài ra có hai giải phụ (Tinh thần hợp tác, Trình bày tiếng Anh xuất sắc) và giải Đội thi được yêu thích nhất, mỗi giải 1.000.000 đồng.";

export const partners: { name: string; logo?: string; ink?: boolean }[] = [
  { name: "Trường Quốc tế - ĐHQGHN", logo: "/images/org/truong-crest.png" },
  { name: "Đoàn TNCS Hồ Chí Minh", logo: "/images/org/doan.png" },
  { name: "Liên chi đoàn Kinh tế - Quản lý", logo: "/images/org/lcd-ktql-navy.png" },
  { name: "CLB iSupport", logo: "/images/org/isupport.png" },
  { name: "CLB Marketing (IMC)", logo: "/images/org/imc.png" },
];

// TODO(BTC): thêm nhà tài trợ khi ký thoả thuận, ví dụ { name: "Tên DN", logo: "/images/sponsors/ten-dn.png" }
export const sponsors: { name: string; logo?: string }[] = [];

export const eligibility = [
  "Sinh viên đang theo học tại Trường Quốc tế - ĐHQGHN.",
  "Sinh viên các đơn vị đào tạo thành viên, trực thuộc ĐHQGHN.",
  "Sinh viên các trường đại học, học viện khác trong và ngoài Hà Nội.",
  "Khuyến khích sinh viên quốc tế đang học tại Việt Nam đăng ký.",
];

export const eligibilityNote: string =
  "Là sinh viên hệ đại học chính quy, còn trong thời gian đào tạo tại thời điểm đăng ký; xuất trình thẻ sinh viên hoặc giấy xác nhận của trường khi dự các vòng thi trực tiếp.";

export const competencies = personas.map((p) => ({ name: p.title, body: p.body }));

export const judgingRules = [
  "Mỗi vòng có ít nhất 02 giám khảo chấm độc lập; chênh lệch trên 20% tổng điểm phải hội ý và ghi biên bản.",
  "Giám khảo được tập huấn về khung năng lực tối thiểu 90 phút trước mỗi vòng.",
  "Giám khảo có quan hệ hướng dẫn, giảng dạy trực tiếp hoặc thân thuộc với thí sinh phải rút khỏi phiên chấm liên quan.",
  "Đề thi được niêm phong đến thời điểm thi; người soạn đề không tham gia ôn luyện cho thí sinh.",
];

export const sideEvents = [
  {
    tag: "NextGen Business Trip",
    title: "Tham quan doanh nghiệp hàng đầu",
    when: "Tuần 1 tháng 12/2026 · khoảng 04 giờ",
    who: "16 thí sinh vượt qua Vòng Sơ loại",
    body: "Tham quan không gian làm việc, nghe doanh nghiệp giới thiệu mô hình tổ chức và văn hoá, toạ đàm với nhà quản lý cấp trung về cách ra quyết định. Sau chuyến đi, mỗi thí sinh viết một bản ghi nhận ngắn (không quá 300 từ) làm tư liệu cho phần bảo vệ Vòng Bán kết.",
  },
  {
    tag: "NextGen Networking Dinner",
    title: "Tiệc tối kết nối doanh nghiệp",
    when: "Sau Vòng Bán kết, trước Chung kết · khoảng 120 phút",
    who: "Thí sinh vòng trong, doanh nghiệp, giám khảo, cựu sinh viên",
    body: "Mỗi thí sinh có 01 phút tự giới thiệu, sau đó kết nối tự do theo các bàn chủ đề: nhân sự, marketing, tài chính, vận hành, công nghệ.",
  },
];

export const votingRules = [
  "03 đội chung kết, mỗi đội nộp 01 video giới thiệu tối đa 90 giây sau buổi giao đề.",
  "Video của 03 đội được đăng cùng lúc trên fanpage chính thức; bình chọn trong 03 ngày.",
  "01 reaction = 01 điểm; 01 lượt chia sẻ công khai kèm hashtag #NextGenManager = 02 điểm. Chỉ tính tài khoản đã theo dõi fanpage, mỗi tài khoản chia sẻ một lần cho mỗi video.",
  "Nghiêm cấm tài khoản ảo, công cụ tăng tương tác hoặc mua bán lượt tương tác. Giải độc lập, không tính vào điểm thi.",
];

export const faqs: { q: string; a: string; icon: IconName }[] = [
  {
    icon: "users",
    q: "Đối tượng tham gia cuộc thi là ai?",
    a: "Sinh viên hệ đại học chính quy của Trường Quốc tế, các đơn vị thuộc ĐHQGHN và các trường đại học, học viện khác trong và ngoài Hà Nội. Sinh viên quốc tế đang học tại Việt Nam được khuyến khích tham gia.",
  },
  {
    icon: "fileText",
    q: "Hình thức đăng ký như thế nào?",
    a: "Điền form đăng ký trực tuyến và nộp video giới thiệu tối đa 02 phút trả lời câu hỏi tình huống do Ban Tổ chức công bố, kèm 01 ảnh cá nhân. Cuộc thi không thu lệ phí.",
  },
  {
    icon: "usersGroup",
    q: "Có thể đăng ký theo nhóm không?",
    a: "Không, bạn đăng ký cá nhân. Vòng Sơ loại thi theo nhóm 06 người và Vòng Chung kết theo đội 04 người do Ban Tổ chức ghép, trộn sinh viên các trường và các ngành.",
  },
  {
    icon: "calendar",
    q: "Lịch trình chi tiết của cuộc thi?",
    a: "Phát động và mở đăng ký tuần 2 tháng 10/2026, Vòng Đơn tuần 2 tháng 11, Vòng Sơ loại tuần 4 tháng 11, Business Trip và Vòng Bán kết đầu tháng 12, Vòng Chung kết tuần 4 tháng 12/2026. Lịch đầy đủ có ở trang Thể lệ.",
  },
  {
    icon: "briefcase",
    q: "Giải thưởng có bao gồm cơ hội thực tập không?",
    a: "Có. Quán quân nhận vé vào thẳng vòng phỏng vấn cuối chương trình quản trị viên tập sự; giải Cá nhân xuất sắc nhận 01 suất thực tập. Thí sinh từ Vòng Sơ loại nhận giấy chứng nhận được doanh nghiệp đồng hành công nhận khi xét hồ sơ.",
  },
];

// Câu hỏi bổ sung, hiển thị ở trang Thể lệ
export const moreFaqs: { q: string; a: string }[] = [
  {
    q: "Tôi ở ngoài Hà Nội có thi được không?",
    a: "Vòng Đơn thi trực tuyến, thí sinh ngoài Trường thi từ xa có giám sát. Từ Vòng Sơ loại trở đi thi trực tiếp tại cơ sở của Trường Quốc tế.",
  },
  {
    q: "Có được dùng ChatGPT hay công cụ AI khác không?",
    a: "Có, ở Vòng Bán kết và Vòng Chung kết. Bạn phải khai báo đã dùng như thế nào, phần nào là của công cụ, phần nào là phán đoán của mình, và giải trình vì sao giữ hay bác bỏ gợi ý. Điểm tập trung vào phần giải trình.",
  },
  {
    q: "Báo cáo năng lực cá nhân là gì?",
    a: "Bản phản hồi điện tử về điểm mạnh, điểm cần cải thiện và gợi ý phát triển, dựa trên dữ liệu chấm thực tế, gửi tới thí sinh từ Vòng Sơ loại trở lên vào tháng 01/2027.",
  },
];
