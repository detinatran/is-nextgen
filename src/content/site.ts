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
  // Hạn đăng ký chính thức (Ban Tổ chức chốt 31/10/2026). Hạn thực tế lấy từ hệ thống: competitions.registration_closes_at.
  registrationDeadline: "2026-10-31T23:59:00+07:00",
  registrationDeadlineLabel: "23:59, 31/10/2026",
  // Mỗi phần tử là một cụm không bị ngắt dòng giữa chừng
  address: {
    unit: ["Khoa Kinh tế và Quản lý,", "Trường Quốc tế - ĐHQGHN"],
    street: ["Toà D2, ĐHQGHN,", "144 Xuân Thuỷ,", "Cầu Giấy, Hà Nội"],
  },
  // Liên hệ Ban Tổ chức (hotline theo thông báo của Ban Tổ chức, không dùng số của thầy cô)
  contact: {
    email: "nextgen@vnuis.edu.vn",
    hotlines: [
      { name: "Ms. Giang", phone: "0388 674 655" },
      { name: "Ms. Thu", phone: "0919 746 896" },
    ],
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
  { icon: "briefcase", value: "Thực tập", label: "cơ hội tại doanh nghiệp đồng hành" },
  { icon: "handshake", value: "Kết nối", label: "với chuyên gia và lãnh đạo doanh nghiệp" },
  { icon: "fileChart", value: "03 vòng", label: "Discover · Decide · Deliver, chấm theo năng lực" },
  { icon: "users", value: "GS · PGS · TS", label: "và đại diện doanh nghiệp đồng hành" },
];

export const about = {
  title: ["Cuộc thi Quản trị Thực chiến Đầu tiên", "ứng dụng ", "Khung Năng lực Hành vi & Trí tuệ Nhân tạo (AI)"],
  body: "NextGen Manager 2026 do Khoa Kinh tế và Quản lý, Trường Quốc tế (ĐHQGHN) tổ chức là sân chơi học thuật dành cho sinh viên toàn quốc. Thông qua ba vòng thi Discover – Decide – Deliver, từ hồ sơ, video và bài kiểm tra năng lực, thảo luận nhóm xử lý tình huống doanh nghiệp đến xử lý tình huống điều hành ở Chung kết, cuộc thi tạo môi trường để bạn rèn luyện tư duy hệ thống, năng lực ra quyết định trong điều kiện thiếu thông tin và bản lĩnh ứng dụng trí tuệ nhân tạo (AI) vào quản trị. Đây cũng là cơ hội để bạn tham quan doanh nghiệp, giao lưu với nhà quản lý tại Gala dinner networking và mở rộng cơ hội thực tập tại các doanh nghiệp đồng hành.",
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
      body: "Tiếp cận doanh nghiệp đồng hành, cơ hội thực tập và vé vào thẳng vòng phỏng vấn cuối.",
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
    { title: "Thực tập & cơ hội nghề nghiệp", body: "Cơ hội thực tập và vé vào thẳng vòng phỏng vấn cuối chương trình Management Trainee.", href: "/#giai-thuong" },
    { title: "Kết nối mạng lưới", body: "Gặp gỡ doanh nghiệp, giám khảo và cộng đồng sinh viên toàn quốc.", href: "/#trai-nghiem" },
    { title: "Phát triển toàn diện", body: "Rèn tư duy hệ thống, năng lực ra quyết định và bản lĩnh ứng dụng AI qua từng vòng thi.", href: "/the-le/" },
  ],
};

// "Hành trình trải nghiệm": các hoạt động nổi bật trong mùa giải
export const journey = {
  title: "Hành trình trải nghiệm",
  more: "Xem toàn bộ thể lệ",
  items: [
    { title: "Thảo luận nhóm không người dẫn", body: "Vòng 2 – Decide: các đội xếp ngẫu nhiên cùng xử lý tình huống thực tiễn của doanh nghiệp, không có người điều phối.", image: "/images/is/sv-thao-luan.webp", href: "/the-le/#vong-2" },
    { title: "Xử lý tình huống điều hành", body: "Chung kết – Deliver: phần thi nhóm và phần thi cá nhân giải bài toán thực tiễn do doanh nghiệp đề xuất.", image: "/images/is/sv-man-hinh.webp", href: "/the-le/#vong-3" },
    { title: "Tham quan doanh nghiệp & toạ đàm", body: "Field trip 14/11: thí sinh Vòng 2 tham quan mô hình doanh nghiệp và toạ đàm với nhà quản lý.", image: "/images/is/sv-giang-duong.webp", href: "/the-le/#ben-le" },
    { title: "Gala dinner networking", body: "Tối 28/11: giao lưu, kết nối thí sinh với chuyên gia và doanh nghiệp đồng hành.", image: "/images/is/sv-ban-tron.webp", href: "/the-le/#ben-le" },
  ],
};

export const themeSection = {
  body: "Trí tuệ nhân tạo (AI) đang tái định hình phương thức vận hành của mọi doanh nghiệp. Cuộc thi NextGen Manager 2026 đặt ra thách thức tìm kiếm và bồi dưỡng thế hệ nhà quản trị trẻ có tư duy hệ thống, năng lực ra quyết định chính xác trong điều kiện thiếu thông tin, và bản lĩnh ứng dụng AI làm công cụ hỗ trợ đắc lực nhưng vẫn giữ vững phán đoán độc lập.",
  points: ["Ứng dụng AI trong quản trị", "Giải quyết vấn đề thực tiễn từ doanh nghiệp", "Đề xuất giải pháp sáng tạo, bền vững và khả thi", "Sẵn sàng dẫn dắt trong môi trường toàn cầu"],
  quote: "Không chỉ là một cuộc thi, mà còn là hành trình khám phá và khẳng định bản thân.",
};

// Ba vòng thi theo Hồ sơ tài trợ của Ban Tổ chức (Discover – Decide – Deliver)
export const rounds = [
  {
    no: "01",
    step: "Vòng 1 · Discover",
    short: "Hồ sơ, video & bài test",
    name: "Hồ sơ và kiểm tra năng lực",
    format: "Cá nhân · Trực tuyến",
    duration: "07/11/2026 · 8h00 – 23h59",
    body: "Nộp hồ sơ trực tuyến kèm 01 video cá nhân tối đa 02 phút (chủ đề tự chọn) và 01 ảnh cá nhân. Làm bài kiểm tra trắc nghiệm khách quan về chân dung nhà quản trị trong kỷ nguyên AI, thi trực tuyến trên website cuộc thi, kết quả chấm tự động.",
    funnel: "Hồ sơ → 40 thí sinh",
    gradient: "from-[#2f6bf0] to-[#1d47c8]",
  },
  {
    no: "02",
    step: "Vòng 2 · Decide",
    short: "Thảo luận nhóm",
    name: "Thảo luận nhóm xử lý tình huống doanh nghiệp",
    format: "Theo đội · Trực tiếp",
    duration: "21/11/2026 · 9h00 – 16h30",
    body: "Thí sinh vượt qua Vòng 1 được xếp ngẫu nhiên thành các đội, xử lý tình huống thực tiễn theo đề bài của doanh nghiệp, làm việc nhóm không có người điều phối, thuyết trình và trả lời câu hỏi của Ban Giám khảo. Giám khảo đánh giá theo khung năng lực hành vi.",
    funnel: "40 → 16 thí sinh",
    gradient: "from-[#1d3f9a] to-[#2a5bd6]",
  },
  {
    no: "03",
    step: "Chung kết · Deliver",
    short: "Xử lý tình huống điều hành",
    name: "Xử lý tình huống điều hành",
    format: "Thi nhóm & thi cá nhân",
    duration: "05/12/2026",
    body: "Vòng Chung kết gồm hai phần: phần thi nhóm (chấm điểm cá nhân) và phần thi cá nhân xử lý tình huống, giải quyết bài toán thực tiễn do doanh nghiệp đề xuất.",
    funnel: "16 thí sinh",
    gradient: "from-[#f2711c] to-[#e0313e]",
  },
];

export const roundIcons: IconName[] = ["fileText", "messages", "presentation"];

export const roundsIntro: string =
  "Mỗi vòng thi là một thử thách khác nhau, giúp bạn phát triển từ tư duy đến kỹ năng thực chiến dưới sự đánh giá của giảng viên và doanh nghiệp.";

export const values = {
  eyebrow: "Đầu tư cho tương lai",
  title: ["Sẵn sàng năng lực –", "Dẫn lối sự nghiệp"],
  body: "Cơ hội thực tập, vé vào thẳng vòng phỏng vấn cuối chương trình quản trị viên tập sự, cùng chuyến tham quan doanh nghiệp và Gala dinner networking cho thí sinh vòng trong.",
  items: [
    { icon: "fileChart" as IconName, title: "Kiến thức thực tiễn", body: "Từ chuyên gia và doanh nghiệp" },
    { icon: "briefcase" as IconName, title: "Thực tập & dự án thật", body: "Trải nghiệm môi trường thực tế" },
    { icon: "handshake" as IconName, title: "Kết nối mạng lưới", body: "Với cộng đồng nhân tài & doanh nghiệp" },
    { icon: "rocket" as IconName, title: "Cơ hội nghề nghiệp", body: "Mở rộng cánh cửa sự nghiệp tương lai" },
  ],
};

export const personas = [
  {
    image: "/images/is/chan-dung-1.webp",
    title: "Tư duy phân tích và ra quyết định",
    body: "Xác định đúng vấn đề cốt lõi, dùng dữ liệu, lập luận có căn cứ và dám quyết định khi thông tin chưa đầy đủ.",
  },
  {
    image: "/images/is/chan-dung-2.webp",
    title: "Tư duy hệ thống và sắp xếp ưu tiên",
    body: "Nhìn ra quan hệ nhân quả, phân bổ nguồn lực hạn chế, biết việc gì làm trước và giải thích được vì sao.",
  },
  {
    image: "/images/is/chan-dung-3.webp",
    title: "Lãnh đạo và tạo ảnh hưởng",
    body: "Đề xuất hướng đi, thuyết phục người khác, xử lý bất đồng và chịu trách nhiệm về quyết định của mình.",
  },
  {
    image: "/images/is/chan-dung-4.webp",
    title: "Hợp tác và giao tiếp",
    body: "Lắng nghe, xây dựng trên ý kiến người khác, đóng góp vào kết quả chung thay vì tranh phần nói.",
  },
  {
    image: "/images/is/chan-dung-5.webp",
    title: "Đạo đức và trách nhiệm",
    body: "Cân nhắc lợi ích các bên liên quan, chính trực trong đề xuất, nhận diện được rủi ro đạo đức.",
  },
  {
    image: "/images/is/chan-dung-6.webp",
    title: "Trình bày và ngôn ngữ",
    body: "Cấu trúc thông điệp rõ ràng, thuyết phục bằng lời và hình ảnh, trình bày được bằng tiếng Anh.",
  },
];

// until: hết ngày của mốc, dùng để đánh dấu giai đoạn đang diễn ra
export const milestones: { date: string; title: string; icon: IconName; tone: "orange" | "blue" | "red" | "gold"; until: string }[] = [
  { date: "11 - 31.10.2026", title: "Mở đơn đăng ký", icon: "fileText", tone: "orange", until: "2026-10-31T23:59:00+07:00" },
  { date: "07.11.2026", title: "Vòng 1 · Discover", icon: "fileChart", tone: "blue", until: "2026-11-11T23:59:00+07:00" },
  { date: "21.11.2026", title: "Vòng 2 · Decide", icon: "messages", tone: "red", until: "2026-11-25T23:59:00+07:00" },
  { date: "05.12.2026", title: "Chung kết · Deliver", icon: "trophy", tone: "gold", until: "2026-12-05T23:59:00+07:00" },
];

// Lộ trình đầy đủ (theo Hồ sơ tài trợ của Ban Tổ chức), hiển thị ở trang Thể lệ
export const timeline = [
  { date: "11/10/2026", title: "Mở đơn đăng ký", body: "Mở cổng đăng ký trực tuyến, tiếp nhận hồ sơ và video" },
  { date: "21/10/2026", title: "Lễ khai mạc & Workshop", body: "Giới thiệu cuộc thi, hội thảo kỹ năng và kiến thức" },
  { date: "31/10/2026", title: "Đóng đơn đăng ký", body: "Hạn cuối nộp hồ sơ và video (23:59)" },
  { date: "07/11/2026", title: "Vòng 1 · Discover", body: "8h00 – 23h59, thi trực tuyến, chấm tự động" },
  { date: "11/11/2026", title: "Kết quả Vòng 1", body: "Công bố danh sách thí sinh vào Vòng 2" },
  { date: "14/11/2026", title: "Field trip", body: "Tham quan mô hình doanh nghiệp, toạ đàm với nhà quản lý" },
  { date: "21/11/2026", title: "Vòng 2 · Decide", body: "9h00 – 16h30, giải bài toán doanh nghiệp theo đội" },
  { date: "25/11/2026", title: "Kết quả Vòng 2", body: "Công bố danh sách thí sinh vào Chung kết" },
  { date: "28/11/2026", title: "Gala dinner networking", body: "18h30 – 22h00, kết nối với chuyên gia và doanh nghiệp" },
  { date: "05/12/2026", title: "Chung kết · Deliver", body: "Phần thi nhóm và phần thi cá nhân" },
];

// Cơ cấu giải theo Ban Tổ chức; không công bố số tiền thưởng trên website
export const prizes: { rank: string; qty: string; perks: string[]; icon: IconName; featured?: boolean }[] = [
  {
    rank: "Giải Nhất",
    qty: "01 thí sinh",
    perks: ["Thí sinh xuất sắc nhất vòng pitching Chung kết", "Vé vào thẳng vòng phỏng vấn cuối chương trình quản trị viên tập sự", "Cơ hội thực tập tại nhà tài trợ", "Giấy chứng nhận và kỷ niệm chương"],
    icon: "crown",
    featured: true,
  },
  { rank: "Giải Nhì", qty: "01 thí sinh", perks: ["Thí sinh xuất sắc nhì vòng pitching Chung kết", "Giấy chứng nhận và kỷ niệm chương"], icon: "medal" },
  { rank: "Giải Ba", qty: "01 thí sinh", perks: ["Thí sinh xuất sắc ba vòng pitching Chung kết", "Giấy chứng nhận và kỷ niệm chương"], icon: "award" },
  { rank: "Giải Khuyến khích", qty: "03 thí sinh", perks: ["Các thí sinh còn lại của vòng pitching Chung kết", "Giấy chứng nhận và kỷ niệm chương"], icon: "star" },
  { rank: "Nhóm xuất sắc nhất", qty: "01 nhóm", perks: ["Nhóm thi xuất sắc nhất", "Giấy chứng nhận"], icon: "usersGroup" },
  { rank: "Cá nhân được yêu thích nhất", qty: "01 thí sinh", perks: ["Bình chọn từ video của 40 thí sinh đăng trên fanpage", "Giấy chứng nhận"], icon: "sparkles" },
];

export const minorPrizes: string =
  "Cơ cấu giải chi tiết theo Thể lệ chính thức của Ban Tổ chức.";

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
    title: "Tham quan và trải nghiệm doanh nghiệp",
    when: "14/11/2026",
    who: "Thí sinh vượt qua Vòng 1 (dự kiến 40 thí sinh), giảng viên cố vấn, Ban Tổ chức",
    body: "Tham quan không gian làm việc, tìm hiểu mô hình tổ chức, chiến lược, văn hoá và quy trình vận hành; trao đổi với đội ngũ quản lý về ra quyết định, sắp xếp ưu tiên, điều hành đội nhóm và các cơ hội thực tập, chương trình quản trị viên tập sự. Sau chuyến đi, mỗi thí sinh viết bản ghi nhận ngắn về một quyết định quản trị quan sát được (không tính điểm), làm tư liệu tham khảo cho phần thi cá nhân tại Chung kết.",
  },
  {
    tag: "NextGen Networking Dinner",
    title: "Gala dinner kết nối doanh nghiệp",
    when: "18h30 – 22h00, 28/11/2026",
    who: "Thí sinh Vòng Chung kết, doanh nghiệp đồng hành, Ban Giám khảo, cố vấn chuyên môn, đại diện Nhà trường (khoảng 40 khách mời)",
    body: "Phát biểu của đại diện Nhà trường và doanh nghiệp, phần giới thiệu bản thân ngắn của thí sinh và networking theo các nhóm lĩnh vực: nhân sự, marketing, tài chính, vận hành, công nghệ.",
  },
];

export const votingRules = [
  "Video cá nhân của 40 thí sinh vào Vòng 2 được đăng trên fanpage chính thức của cuộc thi.",
  "01 reaction = 01 điểm; 01 lượt chia sẻ công khai kèm hashtag #NextGenManager = 02 điểm. Chỉ tính tài khoản đã theo dõi fanpage, mỗi tài khoản chia sẻ một lần cho mỗi video.",
  "Thí sinh có tổng điểm tương tác cao nhất nhận giải Cá nhân được yêu thích nhất.",
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
    a: "Điền form đăng ký trực tuyến, nộp 01 video cá nhân tối đa 02 phút (chủ đề tự chọn) và 01 ảnh cá nhân. Cuộc thi không thu lệ phí; mỗi email chỉ đăng ký một lần.",
  },
  {
    icon: "usersGroup",
    q: "Có thể đăng ký theo nhóm không?",
    a: "Không, bạn đăng ký cá nhân. Ở Vòng 2, Ban Tổ chức xếp thí sinh ngẫu nhiên thành các đội; Vòng Chung kết gồm phần thi nhóm và phần thi cá nhân.",
  },
  {
    icon: "calendar",
    q: "Lịch trình chi tiết của cuộc thi?",
    a: "Mở đăng ký 11/10/2026 (hạn chót 23:59 ngày 31/10), Lễ khai mạc 21/10, Vòng 1 thi trực tuyến ngày 07/11, Field trip 14/11, Vòng 2 ngày 21/11, Gala dinner networking 28/11 và Chung kết ngày 05/12/2026. Lịch đầy đủ có ở trang Thể lệ.",
  },
  {
    icon: "briefcase",
    q: "Giải thưởng có bao gồm cơ hội thực tập không?",
    a: "Có. Giải Nhất nhận vé vào thẳng vòng phỏng vấn cuối chương trình quản trị viên tập sự và cơ hội thực tập tại nhà tài trợ. Thí sinh vòng trong còn được tham quan doanh nghiệp và giao lưu với nhà quản lý tại Field trip và Gala dinner networking.",
  },
];

// Câu hỏi bổ sung, hiển thị ở trang Thể lệ
export const moreFaqs: { q: string; a: string }[] = [
  {
    q: "Tôi ở ngoài Hà Nội có thi được không?",
    a: "Vòng 1 thi trực tuyến trên website cuộc thi. Vòng 2 và Vòng Chung kết thi trực tiếp tại Trường Quốc tế - ĐHQGHN (số 1 Phan Tây Nhạc, Xuân Phương, Nam Từ Liêm, Hà Nội).",
  },
  {
    q: "Có được dùng ChatGPT hay công cụ AI khác không?",
    a: "Có. Cuộc thi cho phép thí sinh kết hợp công nghệ thông minh để tra cứu, đồng thời đánh giá khả năng suy luận và sáng tạo của chính bạn, nhất là trong vòng thảo luận nhóm không có người hướng dẫn.",
  },
];
