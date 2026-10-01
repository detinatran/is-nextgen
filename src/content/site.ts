// Toàn bộ nội dung tĩnh của trang, lấy từ "Kế hoạch tổ chức cuộc thi IS NextGen Manager final".
// Sửa chữ, số liệu, mốc thời gian tại đây; không cần đụng tới component.

export const site = {
  name: "IS-NextGen Manager Challenge 2026",
  shortName: "IS-NEXTGEN MANAGER",
  viName: "Nhà Quản trị trong Kỷ nguyên mới",
  organizer: "Khoa Kinh tế và Quản lý · Trường Quốc tế",
  season: "Mùa I · 2026 · Trường Quốc tế, ĐHQGHN",
  theme: "Chân dung Nhà quản trị trong kỷ nguyên AI",
  themeEn: "The Manager in the AI Era",
  hashtag: "#ISNextGenManager",
  // TODO(BTC): thay bằng hạn đăng ký chính thức. Vòng 1 diễn ra tuần 2/11/2026.
  registrationDeadline: "2026-11-01T23:59:00+07:00",
  registrationDeadlineLabel: "23:59, 01/11/2026 (dự kiến)",
  address: "Khoa Kinh tế và Quản lý, Trường Quốc tế, Đại học Quốc gia Hà Nội. Số 01 Phan Tây Nhạc, Hà Nội.",
  // TODO(BTC): điền thông tin liên hệ thật.
  contact: {
    email: "",
    phone: "",
    fanpage: "",
    sponsorDeck: "",
  },
};

export const nav = [
  { href: "#gioi-thieu", label: "Giới thiệu" },
  { href: "#the-le", label: "Thể lệ" },
  { href: "#lo-trinh", label: "Lộ trình" },
  { href: "#ket-qua", label: "Kết quả" },
  { href: "#giai-thuong", label: "Giải thưởng" },
  { href: "#hoi-dap", label: "Hỏi đáp" },
];

export const stats = [
  { value: "250+", label: "thí sinh dự kiến" },
  { value: "04", label: "vòng thi trong 3 tháng" },
  { value: "0đ", label: "lệ phí dự thi" },
  { value: "14,5tr", label: "tổng tiền thưởng", highlight: true },
];

export const highlights = [
  {
    title: "Chấm theo khung năng lực hành vi",
    body: "Sáu nhóm năng lực, mỗi nhóm năm mức hành vi quan sát được. Giám khảo ghi nhận hành vi rồi mới quy đổi ra điểm.",
  },
  {
    title: "Báo cáo năng lực cá nhân",
    body: "Thí sinh nhận phản hồi riêng về điểm mạnh, điểm cần cải thiện và gợi ý phát triển, dựa trên dữ liệu chấm thực tế.",
  },
  {
    title: "Đề bài từ doanh nghiệp thật",
    body: "Chung kết giải một bài toán quản trị có thật; lãnh đạo doanh nghiệp ngồi hội đồng và phản hồi trực tiếp cho các đội.",
  },
  {
    title: "Thảo luận nhóm không có người dẫn",
    body: "Tình huống có xung đột lợi ích, không chỉ định nhóm trưởng; các bạn tự hình thành cách phối hợp để đi đến quyết định chung.",
  },
  {
    title: "Cộng tác với trí tuệ nhân tạo",
    body: "Được dùng AI ở Vòng 3 và Chung kết, nhưng phải khai báo và giải trình vì sao giữ hay bác bỏ gợi ý của công cụ.",
  },
  {
    title: "Tiệc tối kết nối doanh nghiệp",
    body: "Một buổi tối riêng để thí sinh vòng trong gặp đại diện doanh nghiệp, giám khảo và cựu sinh viên.",
  },
  {
    title: "Tham quan tập đoàn hàng đầu",
    body: "Thí sinh vượt qua Vòng 2 được quan sát trực tiếp mô hình tổ chức và văn hoá quản trị của một doanh nghiệp lớn.",
  },
  {
    title: "Dữ liệu phục vụ nghiên cứu",
    body: "Kết quả chấm qua các mùa trở thành bộ dữ liệu về năng lực quản trị của sinh viên Việt Nam.",
  },
];

export const eligibility = [
  "Sinh viên đang theo học tại Trường Quốc tế - ĐHQGHN.",
  "Sinh viên các đơn vị đào tạo thành viên, trực thuộc ĐHQGHN.",
  "Sinh viên các trường đại học, học viện khác trong và ngoài Hà Nội.",
  "Khuyến khích sinh viên quốc tế đang học tại Việt Nam đăng ký.",
];

export const eligibilityNote =
  "Là sinh viên hệ đại học chính quy, còn trong thời gian đào tạo tại thời điểm đăng ký; xuất trình thẻ sinh viên hoặc giấy xác nhận của trường khi dự các vòng thi trực tiếp.";

export const rounds = [
  {
    no: "01",
    name: "Hồ sơ và kiểm tra năng lực",
    format: "Cá nhân · Trực tuyến",
    duration: "60 phút",
    body: "Nộp hồ sơ kèm video tối đa 90 giây trả lời một câu hỏi tình huống quản trị. Làm bài kiểm tra trực tuyến về tư duy số liệu, tư duy logic và kiến thức quản trị nền tảng; thí sinh ngoài Trường thi từ xa có giám sát.",
    funnel: "250-300 → 40 thí sinh",
    image: "/images/generated/round-1.webp",
  },
  {
    no: "02",
    name: "Thảo luận nhóm không có người dẫn",
    format: "Nhóm 06 người",
    duration: "40 phút/nhóm",
    body: "Nhóm sáu thí sinh nhận một tình huống có xung đột lợi ích và phải đi đến quyết định chung. Giám khảo quan sát và chấm theo khung hành vi.",
    funnel: "40 → 16 thí sinh",
    image: "/images/generated/round-2.webp",
  },
  {
    no: "03",
    name: "Xử lý tình huống điều hành",
    format: "Cá nhân · Được dùng AI",
    duration: "90 phút + 15 phút bảo vệ",
    body: "Mô phỏng hộp thư công việc của nhà quản lý: nhiều vấn đề đến cùng lúc, nguồn lực hạn chế. Sắp thứ tự ưu tiên, ra quyết định, giải trình bằng văn bản rồi bảo vệ trước giám khảo.",
    funnel: "16 → 12 thí sinh",
    image: "/images/generated/round-3.webp",
  },
  {
    no: "04",
    name: "Chung kết",
    format: "03 đội × 04 người · Được dùng AI",
    duration: "20 phút/đội",
    body: "Giải bài toán quản trị thật của doanh nghiệp đồng hành trong 05 ngày; trình bày và phản biện trước hội đồng, có phần trình bày bằng tiếng Anh.",
    funnel: "12 thí sinh · 03 đội",
    image: "/images/generated/round-4.webp",
    featured: true,
  },
];

export const competencies = [
  { name: "Tư duy phân tích và ra quyết định", body: "Xác định đúng vấn đề cốt lõi, dùng dữ liệu, lập luận có căn cứ, quyết định trong điều kiện thiếu thông tin." },
  { name: "Tư duy hệ thống và sắp xếp ưu tiên", body: "Nhận diện quan hệ nhân quả, phân bổ nguồn lực hạn chế, biết việc gì làm trước và vì sao." },
  { name: "Lãnh đạo và tạo ảnh hưởng", body: "Đề xuất hướng đi, thuyết phục người khác, xử lý bất đồng, chịu trách nhiệm về quyết định." },
  { name: "Hợp tác và giao tiếp", body: "Lắng nghe, xây dựng trên ý kiến người khác, đóng góp vào kết quả chung thay vì tranh phần nói." },
  { name: "Đạo đức và trách nhiệm", body: "Cân nhắc lợi ích các bên liên quan, chính trực trong đề xuất, nhận diện rủi ro đạo đức." },
  { name: "Trình bày và ngôn ngữ", body: "Cấu trúc thông điệp, thuyết phục bằng lời và hình ảnh, trình bày được bằng tiếng Anh." },
];

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
    who: "16 thí sinh vượt qua Vòng 2",
    body: "Tham quan không gian làm việc, nghe doanh nghiệp giới thiệu mô hình tổ chức và văn hoá, toạ đàm với nhà quản lý cấp trung về cách ra quyết định và điều hành đội nhóm. Sau chuyến đi, mỗi thí sinh viết một bản ghi nhận ngắn làm tư liệu cho phần bảo vệ Vòng 3.",
    image: "/images/generated/business-trip.webp",
  },
  {
    tag: "IS-NextGen Networking Dinner",
    title: "Tiệc tối kết nối doanh nghiệp",
    when: "Sau Vòng 3, trước Chung kết · khoảng 120 phút",
    who: "Thí sinh vòng trong, doanh nghiệp, giám khảo, cựu sinh viên",
    body: "Mỗi thí sinh có 01 phút tự giới thiệu, sau đó kết nối tự do theo các bàn chủ đề: nhân sự, marketing, tài chính, vận hành, công nghệ.",
    image: "/images/generated/networking.webp",
  },
];

export const timeline = [
  { date: "T2 · 10/2026", title: "Lễ phát động", body: "Mở cổng đăng ký trực tuyến" },
  { date: "T4 · 10/2026", title: "Ngày hội thông tin", body: "Giới thiệu thể thức, giải đáp thắc mắc" },
  { date: "T2 · 11/2026", title: "Vòng 1", body: "Kiểm tra năng lực trực tuyến" },
  { date: "T4 · 11/2026", title: "Vòng 2", body: "Thảo luận nhóm không có người dẫn" },
  { date: "T1 · 12/2026", title: "Business Trip", body: "Tham quan doanh nghiệp" },
  { date: "T2 · 12/2026", title: "Vòng 3", body: "Xử lý tình huống điều hành" },
  { date: "T3 · 12/2026", title: "Kết nối & bình chọn", body: "Tiệc tối kết nối, giao đề chung kết, bình chọn đội yêu thích" },
  { date: "T4 · 12/2026", title: "Chung kết", body: "Trình bày, phản biện và trao giải" },
  { date: "01/2027", title: "Báo cáo năng lực", body: "Gửi báo cáo cá nhân tới thí sinh" },
];

export const prizes = [
  { rank: "Giải Nhất", qty: "01 đội", amount: "5.000.000đ", perks: "Vé vào thẳng vòng phỏng vấn cuối chương trình quản trị viên tập sự; giấy chứng nhận có xác nhận của doanh nghiệp.", featured: true },
  { rank: "Giải Nhì", qty: "01 đội", amount: "3.000.000đ", perks: "Giấy chứng nhận của Trường có xác nhận của doanh nghiệp đồng hành." },
  { rank: "Giải Ba", qty: "01 đội", amount: "2.000.000đ", perks: "Giấy chứng nhận của Trường có xác nhận của doanh nghiệp đồng hành." },
  { rank: "Nhà Quản trị xuất sắc nhất", qty: "01 cá nhân", amount: "1.500.000đ", perks: "Kỷ niệm chương và 01 suất thực tập tại doanh nghiệp đồng hành." },
];

export const minorPrizes = [
  { name: "Tinh thần hợp tác", amount: "1.000.000đ" },
  { name: "Trình bày tiếng Anh xuất sắc", amount: "1.000.000đ" },
  { name: "Đội thi được yêu thích nhất", amount: "1.000.000đ" },
];

export const prizeTotal = "14.500.000 đồng";

export const sponsorTiers = [
  { tier: "Kim cương", slots: 1 },
  { tier: "Vàng", slots: 2 },
  { tier: "Bạc và chuyên môn", slots: 4 },
];

export const organizers = [
  "Khoa Kinh tế và Quản lý, Trường Quốc tế - ĐHQGHN",
  "Liên chi Đoàn Khoa Kinh tế và Quản lý",
  "CLB Marketing Trường Quốc tế (IMC)",
  "CLB Hỗ trợ học tập và Kỹ năng mềm (iSupport)",
];

export const faqs = [
  {
    q: "Ai được đăng ký dự thi?",
    a: "Sinh viên hệ đại học chính quy của Trường Quốc tế, các đơn vị thuộc ĐHQGHN và các trường đại học, học viện khác trong và ngoài Hà Nội. Sinh viên quốc tế đang học tại Việt Nam được khuyến khích tham gia.",
  },
  {
    q: "Có mất phí dự thi không?",
    a: "Không. Cuộc thi không thu lệ phí.",
  },
  {
    q: "Tôi cần đăng ký theo đội hay cá nhân?",
    a: "Đăng ký cá nhân. Vòng 1 và Vòng 3 thi cá nhân; Vòng 2 thi theo nhóm 06 người và Chung kết theo đội 04 người do Ban Tổ chức ghép, trộn sinh viên trong và ngoài Trường, giữa các ngành học.",
  },
  {
    q: "Tôi ở ngoài Hà Nội có thi được không?",
    a: "Vòng 1 thi trực tuyến; thí sinh ngoài Trường thi từ xa có giám sát. Từ Vòng 2 trở đi thi trực tiếp tại cơ sở của Trường Quốc tế.",
  },
  {
    q: "Video giới thiệu cần những gì?",
    a: "Tối đa 90 giây, giới thiệu bản thân và trả lời một câu hỏi tình huống quản trị do Ban Tổ chức công bố.",
  },
  {
    q: "Có được dùng ChatGPT hay công cụ AI khác không?",
    a: "Có, ở Vòng 3 và Chung kết. Bạn phải khai báo đã dùng như thế nào, phần nào là của công cụ, phần nào là phán đoán của mình, và giải trình vì sao giữ hay bác bỏ gợi ý. Điểm tập trung vào phần giải trình.",
  },
  {
    q: "Báo cáo năng lực cá nhân là gì?",
    a: "Bản phản hồi điện tử về điểm mạnh, điểm cần cải thiện và gợi ý phát triển, dựa trên dữ liệu chấm thực tế. Gửi tới thí sinh từ Vòng 2 trở lên vào tháng 01/2027.",
  },
  {
    q: "Giải Đội thi được yêu thích nhất được bình chọn thế nào?",
    a: `Mỗi đội chung kết nộp một video tối đa 90 giây, đăng cùng lúc trên fanpage cuộc thi và bình chọn trong 03 ngày. 01 reaction = 01 điểm; 01 lượt chia sẻ công khai kèm hashtag #ISNextGenManager = 02 điểm. Chỉ tính tài khoản đã theo dõi fanpage, nghiêm cấm tài khoản ảo hay mua tương tác. Giải này độc lập, không tính vào điểm thi.`,
  },
];
