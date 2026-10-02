// Toàn bộ nội dung chữ của trang, lấy từ "Kế hoạch tổ chức cuộc thi IS NextGen Manager final".
// Sửa chữ, số liệu, mốc thời gian tại đây; không cần đụng tới component.
import type { IconName } from "@/components/Icon";

export const site = {
  name: "IS-NextGen Manager Challenge 2026",
  viName: "Nhà Quản trị trong Kỷ nguyên mới",
  theme: "Chân dung Nhà quản trị trong kỷ nguyên AI",
  themeEn: "The Manager in the AI Era",
  heroTitle: "Nhà quản trị trong kỷ nguyên AI",
  slogan: ["Tư duy mới", "Kỹ năng mới", "Tạo giá trị thật"],
  tagline: "Kiến tạo thế hệ quản trị tiếp theo",
  hashtag: "#ISNextGenManager",
  // TODO(BTC): thay bằng hạn đăng ký chính thức. Vòng 1 diễn ra tuần 2/11/2026.
  registrationDeadline: "2026-11-01T23:59:00+07:00",
  registrationDeadlineLabel: "23:59, 01/11/2026 (dự kiến)",
  address: "Khoa Kinh tế và Quản lý, Trường Quốc tế - ĐHQGHN, Số 01 Phan Tây Nhạc, Hà Nội",
  // TODO(BTC): điền thông tin liên hệ và mạng xã hội thật; để trống thì ẩn.
  contact: {
    email: "",
    phone: "",
    fanpage: "",
    sponsorDeck: "",
  },
  socials: {
    facebook: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
  },
  // TODO(BTC): link video giới thiệu (YouTube); để trống thì nút phát hiện "sắp ra mắt".
  videoUrl: "",
};

export const nav = [
  { href: "/#top", label: "Trang chủ", id: "top" },
  { href: "/#gioi-thieu", label: "Giới thiệu", id: "gioi-thieu" },
  { href: "/#the-le", label: "Thể lệ", id: "the-le" },
  { href: "/#lo-trinh", label: "Lộ trình", id: "lo-trinh" },
  { href: "/#giai-thuong", label: "Giải thưởng", id: "giai-thuong" },
  { href: "/#hoi-dap", label: "FAQ", id: "hoi-dap" },
];

export const heroStats: { icon: IconName; value: string; label: string; tone?: "sky" | "gold" }[] = [
  { icon: "users", value: "250+", label: "Thí sinh tham dự" },
  { icon: "landmark", value: "04", label: "Vòng thi hấp dẫn", tone: "sky" },
  { icon: "trophy", value: "14.5tr", label: "Tổng giá trị giải thưởng", tone: "gold" },
  // Kế hoạch: 6-8 giám khảo Vòng 2-3, 05 giám khảo chung kết, 02-03 giảng viên cố vấn
  { icon: "star", value: "10+", label: "Chuyên gia đồng hành" },
];

export const about = {
  title: ["Cuộc thi đa năng lực, đa tầm nhìn", "cho ", "thế hệ quản trị tương lai"],
  body: "IS-NextGen Manager 2026 là sân chơi học thuật, nơi sinh viên trên toàn quốc được thử thách tư duy, rèn luyện kỹ năng và kiến tạo những giải pháp quản trị sáng tạo trong bối cảnh kỷ nguyên AI.",
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

export const themeSection = {
  body: "AI đang tái định hình mọi lĩnh vực, từ cách chúng ta học tập, làm việc đến cách doanh nghiệp vận hành. IS-NextGen Manager 2026 đặt ra thách thức tìm kiếm những nhà quản trị trẻ có tư duy mới, kỹ năng mới và khả năng tạo ra giá trị thật cho xã hội.",
  points: ["Ứng dụng AI trong quản trị", "Giải quyết vấn đề thực tiễn từ doanh nghiệp", "Đề xuất giải pháp sáng tạo, bền vững và khả thi"],
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
    body: "Nộp hồ sơ trực tuyến kèm video tối đa 90 giây trả lời một câu hỏi tình huống quản trị do Ban Tổ chức công bố. Làm bài kiểm tra trực tuyến gồm tư duy số liệu, tư duy logic và kiến thức quản trị nền tảng; thí sinh ngoài Trường dự thi từ xa có giám sát.",
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

export const experiences = [
  {
    image: "/images/generated/round-case.webp",
    title: "Phân tích tình huống quản trị",
    body: "Bài kiểm tra tư duy số liệu, logic và tình huống hộp thư điều hành: sắp thứ tự ưu tiên, ra quyết định, giải trình.",
    href: "/the-le/#vong-1",
  },
  {
    image: "/images/generated/round-2.webp",
    title: "Làm việc nhóm như ở doanh nghiệp",
    body: "Nhóm sáu người, tình huống có xung đột lợi ích, không ai được chỉ định làm trưởng nhóm.",
    href: "/the-le/#vong-2",
  },
  {
    image: "/images/generated/round-pitch.webp",
    title: "Thuyết trình trước hội đồng chuyên gia",
    body: "Ba đội chung kết trình bày và phản biện trước hội đồng có lãnh đạo doanh nghiệp, có phần bằng tiếng Anh.",
    href: "/the-le/#vong-4",
  },
];

export const values = {
  title: ["Sẵn sàng năng lực,", "dẫn lối sự nghiệp tương lai"],
  body: "Tìm kiếm tri thức, mở rộng mạng lưới và nắm bắt cơ hội nghề nghiệp cùng doanh nghiệp đồng hành, kèm báo cáo năng lực cá nhân cho mỗi thí sinh.",
  items: [
    { icon: "fileChart" as IconName, title: "Kiến thức thực tiễn", body: "Từ chuyên gia và doanh nghiệp" },
    { icon: "target" as IconName, title: "Kỹ năng toàn diện", body: "Phân tích · Sáng tạo · Lãnh đạo" },
    { icon: "handshake" as IconName, title: "Mạng lưới chất lượng", body: "Kết nối bạn bè, mentor, nhà tuyển dụng" },
    { icon: "rocket" as IconName, title: "Cơ hội phát triển", body: "Thực tập, tuyển dụng, giải thưởng giá trị" },
  ],
};

export const personas = [
  {
    image: "/images/generated/persona-1.webp",
    title: "Tư duy phân tích và ra quyết định",
    body: "Xác định đúng vấn đề cốt lõi, dùng dữ liệu, lập luận có căn cứ và dám quyết định khi thông tin chưa đầy đủ.",
  },
  {
    image: "/images/generated/persona-2.webp",
    title: "Tư duy hệ thống và sắp xếp ưu tiên",
    body: "Nhìn ra quan hệ nhân quả, phân bổ nguồn lực hạn chế, biết việc gì làm trước và giải thích được vì sao.",
  },
  {
    image: "/images/generated/persona-3.webp",
    title: "Lãnh đạo và tạo ảnh hưởng",
    body: "Đề xuất hướng đi, thuyết phục người khác, xử lý bất đồng và chịu trách nhiệm về quyết định của mình.",
  },
  {
    image: "/images/generated/persona-4.webp",
    title: "Hợp tác và giao tiếp",
    body: "Lắng nghe, xây dựng trên ý kiến người khác, đóng góp vào kết quả chung thay vì tranh phần nói.",
  },
  {
    image: "/images/generated/persona-5.webp",
    title: "Đạo đức và trách nhiệm",
    body: "Cân nhắc lợi ích các bên liên quan, chính trực trong đề xuất, nhận diện được rủi ro đạo đức.",
  },
  {
    image: "/images/generated/persona-6.webp",
    title: "Trình bày và ngôn ngữ",
    body: "Cấu trúc thông điệp rõ ràng, thuyết phục bằng lời và hình ảnh, trình bày được bằng tiếng Anh.",
  },
];

export const milestones: { date: string; title: string; icon: IconName; tone: "orange" | "blue" | "red" | "gold" }[] = [
  { date: "10 - 01.11.2026", title: "Mở đơn đăng ký", icon: "fileText", tone: "orange" },
  { date: "Tuần 4 · 11/2026", title: "Vòng Sơ loại", icon: "messages", tone: "blue" },
  { date: "Tuần 2 · 12/2026", title: "Vòng Bán kết", icon: "inbox", tone: "red" },
  { date: "Tuần 4 · 12/2026", title: "Vòng Chung kết", icon: "trophy", tone: "gold" },
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
  { name: "Trường Quốc tế - ĐHQGHN", logo: "/images/crest.png" },
  { name: "Khoa Kinh tế và Quản lý" },
  { name: "Đoàn Thanh niên Trường Quốc tế", logo: "/images/org-doan.png" },
  { name: "Ban CLB Hội nhóm", logo: "/images/org-clb.png", ink: true },
  { name: "CLB Marketing (IMC)", logo: "/images/org-imc.png", ink: true },
  { name: "CLB iSupport" },
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
    tag: "IS-NextGen Business Trip",
    title: "Tham quan doanh nghiệp hàng đầu",
    when: "Tuần 1 tháng 12/2026 · khoảng 04 giờ",
    who: "16 thí sinh vượt qua Vòng Sơ loại",
    body: "Tham quan không gian làm việc, nghe doanh nghiệp giới thiệu mô hình tổ chức và văn hoá, toạ đàm với nhà quản lý cấp trung về cách ra quyết định. Sau chuyến đi, mỗi thí sinh viết một bản ghi nhận ngắn (không quá 300 từ) làm tư liệu cho phần bảo vệ Vòng Bán kết.",
  },
  {
    tag: "IS-NextGen Networking Dinner",
    title: "Tiệc tối kết nối doanh nghiệp",
    when: "Sau Vòng Bán kết, trước Chung kết · khoảng 120 phút",
    who: "Thí sinh vòng trong, doanh nghiệp, giám khảo, cựu sinh viên",
    body: "Mỗi thí sinh có 01 phút tự giới thiệu, sau đó kết nối tự do theo các bàn chủ đề: nhân sự, marketing, tài chính, vận hành, công nghệ.",
  },
];

export const votingRules = [
  "03 đội chung kết, mỗi đội nộp 01 video giới thiệu tối đa 90 giây sau buổi giao đề.",
  "Video của 03 đội được đăng cùng lúc trên fanpage chính thức; bình chọn trong 03 ngày.",
  "01 reaction = 01 điểm; 01 lượt chia sẻ công khai kèm hashtag #ISNextGenManager = 02 điểm. Chỉ tính tài khoản đã theo dõi fanpage, mỗi tài khoản chia sẻ một lần cho mỗi video.",
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
    a: "Điền form đăng ký trực tuyến và nộp video tối đa 90 giây trả lời câu hỏi tình huống do Ban Tổ chức công bố. Cuộc thi không thu lệ phí.",
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
