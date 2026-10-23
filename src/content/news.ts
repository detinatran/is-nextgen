export interface NewsSectionContent {
  type: "paragraph" | "heading" | "image" | "quote";
  content?: string;
  caption?: string;
  src?: string;
}

export interface NewsArticleItem {
  id: string;
  slug: string;
  source: string;
  sourceRole?: string;
  originalTitle: string;
  originalUrl: string;
  publishedAt: string;
  publishedDateLabel: string;
  summary: string;
  thumbnail: string;
  thumbnailAlt: string;
  hasFullText: boolean;
  author?: string;
  sapo?: string;
  sections?: NewsSectionContent[];
}

export const newsArticlesVi: NewsArticleItem[] = [
  {
    id: "giaoduc",
    slug: "giaoduc-sinh-vien-truong-quoc-te-dhqghn-thu-suc-voi-bai-toan-quan-tri-doanh-nghiep-trong-ky-nguyen-ai",
    source: "Tạp chí điện tử Giáo dục Việt Nam",
    originalTitle: "Sinh viên Trường Quốc tế - ĐHQGHN thử sức với bài toán quản trị doanh nghiệp trong kỷ nguyên AI",
    originalUrl: "https://giaoduc.net.vn/sinh-vien-truong-quoc-te-dhqghn-thu-suc-voi-bai-toan-quan-tri-doanh-nghiep-trong-ky-nguyen-ai-post263566.gd",
    publishedAt: "2026-10-23T09:11:51+07:00",
    publishedDateLabel: "23/10/2026 · 09:11",
    summary:
      "Sinh viên tiếp cận và thử sức với bài toán quản trị doanh nghiệp thực tế qua mô hình đánh giá năng lực hành vi Enterprise Assessment Center trong bối cảnh phát triển của trí tuệ nhân tạo.",
    thumbnail: "/images/news/giaoduc.webp",
    thumbnailAlt: "Lễ phát động cuộc thi NextGen Manager 2026 tại Trường Quốc tế - ĐHQGHN",
    hasFullText: false,
    author: "Tường San",
  },
  {
    id: "gdtd",
    slug: "gdtd-tao-moi-truong-de-sinh-vien-nganh-kinh-te-ren-luyen-danh-gia-nang-luc",
    source: "Báo Giáo dục & Thời đại",
    originalTitle: "Tạo môi trường để sinh viên ngành Kinh tế rèn luyện, đánh giá năng lực",
    originalUrl: "https://giaoducthoidai.vn/tao-moi-truong-de-sinh-vien-nganh-kinh-te-ren-luyen-danh-gia-nang-luc-post797032.html",
    publishedAt: "2026-10-23T07:22:00+07:00",
    publishedDateLabel: "23/10/2026 · 07:22",
    summary:
      "Cuộc thi xây dựng môi trường học thuật thực chiến giúp sinh viên khối ngành Kinh tế rèn luyện, hoàn thiện sáu nhóm năng lực quản trị cốt lõi thông qua tình huống mô phỏng và đánh giá hành vi.",
    thumbnail: "/images/news/gdtd.webp",
    thumbnailAlt: "Toàn cảnh lễ khai mạc cuộc thi NextGen Manager 2026",
    hasFullText: false,
    author: "Đức Duy",
  },
  {
    id: "vtcnews",
    slug: "vtcnews-bang-diem-dep-chua-du-sinh-vien-thu-suc-lam-nha-quan-tri-trong-ky-nguyen-ai",
    source: "Báo điện tử VTC News",
    sourceRole: "Bảo trợ truyền thông",
    originalTitle: "Bảng điểm đẹp chưa đủ, sinh viên thử sức làm nhà quản trị trong kỷ nguyên AI",
    originalUrl: "https://vtcnews.vn/bang-diem-dep-chua-du-sinh-vien-thu-suc-lam-nha-quan-tri-trong-ky-nguyen-ai-ar1046722.html",
    publishedAt: "2026-10-23T00:06:53+07:00",
    publishedDateLabel: "23/10/2026 · 00:06",
    summary:
      "Khẳng định những năng lực thiết yếu mà doanh nghiệp tìm kiếm ở nhà quản trị trẻ ngoài bảng điểm: khả năng ra quyết định khi thiếu thông tin, lựa chọn thứ tự ưu tiên và tinh thần trách nhiệm.",
    thumbnail: "/images/news/vtc.jpg",
    thumbnailAlt: "PGS.TS Nguyễn Anh Tuấn phát biểu khai mạc cuộc thi Nhà quản trị thế hệ mới 2026",
    hasFullText: true,
    author: "Lệ Thu",
    sapo: "Cuộc thi NextGen Manager 2026 với chủ đề “Chân dung nhà quản trị trong kỷ nguyên AI” hướng tới sinh viên hệ đại học tại các trường đại học, học viện trong và ngoài Đại học Quốc gia Hà Nội, nhằm tạo cơ hội rèn luyện, đánh giá những năng lực quản trị mà doanh nghiệp quan tâm, từ tư duy phân tích, ra quyết định đến lãnh đạo, hợp tác và chịu trách nhiệm.",
    sections: [
      {
        type: "heading",
        content: "Đánh giá năng lực quản trị thay vì chỉ nhìn vào bảng điểm",
      },
      {
        type: "paragraph",
        content:
          "Phát biểu tại lễ khai mạc, PGS.TS Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế (Đại học Quốc gia Hà Nội), Trưởng ban tổ chức, cho biết, trường xác định sứ mệnh là đào tạo, nghiên cứu khoa học và chuyển giao công nghệ theo các tiêu chuẩn kiểm định quốc tế, cung cấp nguồn nhân lực và sản phẩm khoa học - công nghệ chất lượng cao.",
      },
      {
        type: "paragraph",
        content:
          "Điều đó được dựa trên 3 trụ cột: sáng tạo và chuyển giao tri thức, kỹ năng cho người học để phụng sự xã hội; hoàn thành xuất sắc các nhiệm vụ Đại học Quốc gia Hà Nội giao và tự chủ tài chính.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi “Nhà quản trị thế hệ mới” được định vị trong trụ cột thứ nhất; xuất phát từ yêu cầu gắn đào tạo với thực tiễn và chuyển giao kỹ năng cho người học.",
      },
      {
        type: "paragraph",
        content:
          "Theo ông Tuấn, hằng năm, các trường khối kinh tế đào tạo hàng nghìn cử nhân có bảng điểm tốt, nhưng điều doanh nghiệp cần ở một quản trị viên trẻ lại là thứ bảng điểm không đo được: ra quyết định khi thông tin chưa đủ, biết lựa chọn thứ tự ưu tiên trong công việc, biết thuyết phục người khác khi chưa có quyền hạn gì.",
      },
      {
        type: "image",
        src: "/images/news/vtc.jpg",
        caption:
          "PGS.TS Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội phát biểu khai mạc cuộc thi Nhà quản trị thế hệ mới 2026.",
      },
      {
        type: "quote",
        content:
          "“Trí tuệ nhân tạo làm khoảng trống ấy lộ rõ hơn bao giờ hết: AI nâng mức sàn đầu ra của công việc, phần tạo nên khác biệt dịch sang đúng chỗ máy không làm thay. Dạy được những năng lực ấy là một việc, đo xem đã dạy tới đâu là việc khó hơn”, ông Tuấn nói.",
      },
      {
        type: "paragraph",
        content:
          "Điểm đáng chú ý của NextGen Manager 2026 là áp dụng mô hình “Enterprise Assessment Center”, phương pháp đánh giá thường được sử dụng trong tuyển chọn và phát triển nhân sự quản lý tại doanh nghiệp.",
      },
      {
        type: "heading",
        content: "Ba vòng thi, 6 nhóm năng lực",
      },
      {
        type: "paragraph",
        content:
          "Ban tổ chức xây dựng khung đánh giá gồm 6 nhóm năng lực: tư duy phân tích và ra quyết định; tư duy hệ thống và sắp xếp ưu tiên; lãnh đạo và tạo ảnh hưởng; hợp tác và giao tiếp; đạo đức và trách nhiệm; trình bày và ngôn ngữ. Mỗi nhóm được mô tả thông qua năm mức hành vi có thể quan sát.",
      },
      {
        type: "paragraph",
        content:
          "Theo TS Tạ Huy Hùng, Phó trưởng ban tổ chức, Phó trưởng Khoa Kinh tế và Quản lý, Trường Quốc tế, cuộc thi gồm 3 vòng mang tên Discover, Decide và Deliver, tương ứng với ba yêu cầu cơ bản của công việc quản trị: hiểu vấn đề, ra quyết định và tạo ra kết quả.",
      },
      {
        type: "paragraph",
        content:
          "Vòng 1 - Discover diễn ra ngày 7/11/2026. Thí sinh thực hiện video dài hai phút theo chủ đề lựa chọn và bài trắc nghiệm tư duy quản trị trực tuyến. Ban tổ chức dự kiến lựa chọn 40 thí sinh vào vòng tiếp theo.",
      },
      {
        type: "paragraph",
        content:
          "Vòng 2 - Decide diễn ra ngày 21/11/2026, với hình thức thảo luận nhóm không có người dẫn. Các thí sinh được ghép nhóm ngẫu nhiên, cùng giải quyết một tình huống thực tiễn của doanh nghiệp. Không ai được chỉ định làm nhóm trưởng; giám khảo quan sát cách từng thành viên đóng góp, xử lý bế tắc và phối hợp để đưa nhóm đến kết quả. Sau vòng này, 16 thí sinh được lựa chọn vào chung kết.",
      },
      {
        type: "paragraph",
        content:
          "Vòng 3 - Deliver dự kiến diễn ra ngày 5/12/2026. Các đội giải quyết đề bài do doanh nghiệp đồng hành đặt ra, trình bày và bảo vệ phương án trước hội đồng giám khảo. Tiếp đó, sáu thí sinh xuất sắc nhất tham gia phần thi cá nhân để thể hiện khả năng xử lý tình huống quản trị độc lập.",
      },
      {
        type: "paragraph",
        content:
          "Bên cạnh ba vòng thi, chương trình có hoạt động NextGen Business Field Trip ngày 14/11, tạo cơ hội để thí sinh trải nghiệm môi trường doanh nghiệp, và NextGen Gala Dinner Networking ngày 28/11, kết nối sinh viên với lãnh đạo doanh nghiệp, chuyên gia.",
      },
      {
        type: "paragraph",
        content:
          "Mỗi vòng có ít nhất hai giám khảo đến từ nhà trường và doanh nghiệp chấm độc lập; trường hợp chênh lệch điểm lớn sẽ được xem xét chấm lại. Đáng chú ý, thí sinh được phép sử dụng AI trong cuộc thi. Theo ban tổ chức, việc này phù hợp với thực tế công việc hiện nay, đồng thời giúp tập trung đánh giá những năng lực mà công nghệ không thể thay thế hoàn toàn, như xác định đúng vấn đề, chịu trách nhiệm với quyết định và phối hợp với con người.",
      },
      {
        type: "heading",
        content: "Doanh nghiệp trực tiếp ra đề, đánh giá thí sinh",
      },
      {
        type: "paragraph",
        content:
          "Một điểm khác biệt là đề bài vòng chung kết do doanh nghiệp đồng hành đưa ra, xuất phát từ những bài toán quản trị thực tế. Qua đó, sinh viên có cơ hội vận dụng kiến thức vào vấn đề cụ thể thay vì chỉ giải quyết các tình huống giả định trong giáo trình. Các doanh nghiệp đồng hành còn tham gia xây dựng đề bài, chấm thi và tạo cơ hội để sinh viên tiếp xúc với môi trường làm việc thực tế.",
      },
      {
        type: "paragraph",
        content:
          "Tổng giá trị giải thưởng cuộc thi là hơn 100 triệu đồng, gồm tám giải thưởng: giải Nhất, Nhì, Ba, ba giải Khuyến khích, giải Nhóm xuất sắc nhất và giải Cá nhân được yêu thích nhất. Các giải thưởng gồm tiền mặt, kỷ niệm chương, giấy chứng nhận, học bổng và cơ hội thực tập hoặc làm việc tại doanh nghiệp theo lựa chọn của hội đồng giám khảo.",
      },
      {
        type: "paragraph",
        content:
          "Theo ban tổ chức, cuộc thi được định hướng tổ chức thường niên, không giới hạn trong phạm vi Đại học Quốc gia Hà Nội. Sinh viên các trường đại học, học viện trên cả nước có thể đăng ký tham gia miễn phí. Cổng đăng ký tại website nextgen.vnuis.edu.vn dự kiến đóng vào hết ngày 31/10/2026.",
      },
      {
        type: "paragraph",
        content:
          "Thông qua cuộc thi, Trường Quốc tế kỳ vọng tăng cường kết nối giữa cơ sở đào tạo và doanh nghiệp, đồng thời giúp sinh viên nhận diện khoảng cách giữa kiến thức học thuật với yêu cầu thực tế của công việc quản trị, từ đó chủ động xây dựng lộ trình phát triển năng lực trước khi bước vào thị trường lao động.",
      },
    ],
  },
  {
    id: "ttxvn",
    slug: "ttxvn-phat-dong-cuoc-thi-nha-quan-tri-the-he-moi-nextgen-manager-2026-danh-cho-sinh-vien-toan-quoc",
    source: "Chính sách và Cuộc sống — TTXVN",
    originalTitle: "Phát động Cuộc thi Nhà Quản trị thế hệ mới - NextGen Manager 2026 dành cho sinh viên toàn quốc",
    originalUrl: "https://chinhsachcuocsong.vnanet.vn/phat-dong-cuoc-thi-nha-quan-tri-the-he-moi-nextgen-manager-2026-danh-cho-sinh-vien-toan-quoc/99546.html",
    publishedAt: "2026-10-22T22:12:00+07:00",
    publishedDateLabel: "22/10/2026 · 22:12",
    summary:
      "Lễ phát động toàn quốc cuộc thi NextGen Manager 2026 với hành trình ba vòng Discover – Decide – Deliver, mở rộng cơ hội tham gia hoàn toàn miễn phí cho sinh viên các trường đại học trên cả nước.",
    thumbnail: "/images/news/ttxvn.jpg",
    thumbnailAlt: "Lễ phát động Cuộc thi Nhà Quản trị thế hệ mới - NextGen Manager 2026",
    hasFullText: false,
    author: "Việt Hà - TTXVN",
  },
];

export const newsArticlesEn: NewsArticleItem[] = [
  {
    id: "giaoduc",
    slug: "giaoduc-sinh-vien-truong-quoc-te-dhqghn-thu-suc-voi-bai-toan-quan-tri-doanh-nghiep-trong-ky-nguyen-ai",
    source: "Vietnam Education Electronic Magazine",
    originalTitle: "Sinh viên Trường Quốc tế - ĐHQGHN thử sức với bài toán quản trị doanh nghiệp trong kỷ nguyên AI",
    originalUrl: "https://giaoduc.net.vn/sinh-vien-truong-quoc-te-dhqghn-thu-suc-voi-bai-toan-quan-tri-doanh-nghiep-trong-ky-nguyen-ai-post263566.gd",
    publishedAt: "2026-10-23T09:11:51+07:00",
    publishedDateLabel: "23/10/2026 · 09:11",
    summary:
      "Students tackle real-world enterprise management challenges assessed through the Enterprise Assessment Center behavioral model, fostering strategic leadership in the era of artificial intelligence.",
    thumbnail: "/images/news/giaoduc.webp",
    thumbnailAlt: "Opening launch of NextGen Manager 2026 at VNU International School",
    hasFullText: false,
    author: "Tuong San",
  },
  {
    id: "gdtd",
    slug: "gdtd-tao-moi-truong-de-sinh-vien-nganh-kinh-te-ren-luyen-danh-gia-nang-luc",
    source: "Education & Times Newspaper",
    originalTitle: "Tạo môi trường để sinh viên ngành Kinh tế rèn luyện, đánh giá năng lực",
    originalUrl: "https://giaoducthoidai.vn/tao-moi-truong-de-sinh-vien-nganh-kinh-te-ren-luyen-danh-gia-nang-luc-post797032.html",
    publishedAt: "2026-10-23T07:22:00+07:00",
    publishedDateLabel: "23/10/2026 · 07:22",
    summary:
      "An experiential academic platform enabling economics students to hone and refine six core managerial competencies through practical simulation scenarios and behavioral assessments.",
    thumbnail: "/images/news/gdtd.webp",
    thumbnailAlt: "Overview of the NextGen Manager 2026 opening ceremony",
    hasFullText: false,
    author: "Duc Duy",
  },
  {
    id: "vtcnews",
    slug: "vtcnews-bang-diem-dep-chua-du-sinh-vien-thu-suc-lam-nha-quan-tri-trong-ky-nguyen-ai",
    source: "VTC News Online",
    sourceRole: "Official Media Partner",
    originalTitle: "Bảng điểm đẹp chưa đủ, sinh viên thử sức làm nhà quản trị trong kỷ nguyên AI",
    originalUrl: "https://vtcnews.vn/bang-diem-dep-chua-du-sinh-vien-thu-suc-lam-nha-quan-tri-trong-ky-nguyen-ai-ar1046722.html",
    publishedAt: "2026-10-23T00:06:53+07:00",
    publishedDateLabel: "23/10/2026 · 00:06",
    summary:
      "Highlighting essential qualities that employers look for in young leaders beyond academic transcripts: decision-making under uncertainty, prioritization, and professional accountability.",
    thumbnail: "/images/news/vtc.jpg",
    thumbnailAlt: "Assoc. Prof. Dr. Nguyen Anh Tuan speaks at the launch of NextGen Manager 2026",
    hasFullText: true,
    author: "Le Thu",
    sapo: "Cuộc thi NextGen Manager 2026 với chủ đề “Chân dung nhà quản trị trong kỷ nguyên AI” hướng tới sinh viên hệ đại học tại các trường đại học, học viện trong và ngoài Đại học Quốc gia Hà Nội, nhằm tạo cơ hội rèn luyện, đánh giá những năng lực quản trị mà doanh nghiệp quan tâm, từ tư duy phân tích, ra quyết định đến lãnh đạo, hợp tác và chịu trách nhiệm.",
    sections: newsArticlesVi[2].sections,
  },
  {
    id: "ttxvn",
    slug: "ttxvn-phat-dong-cuoc-thi-nha-quan-tri-the-he-moi-nextgen-manager-2026-danh-cho-sinh-vien-toan-quoc",
    source: "Policy & Life — Vietnam News Agency (VNA)",
    originalTitle: "Phát động Cuộc thi Nhà Quản trị thế hệ mới - NextGen Manager 2026 dành cho sinh viên toàn quốc",
    originalUrl: "https://chinhsachcuocsong.vnanet.vn/phat-dong-cuoc-thi-nha-quan-tri-the-he-moi-nextgen-manager-2026-danh-cho-sinh-vien-toan-quoc/99546.html",
    publishedAt: "2026-10-22T22:12:00+07:00",
    publishedDateLabel: "22/10/2026 · 22:12",
    summary:
      "Nationwide launch of NextGen Manager 2026 with its three-round journey Discover – Decide – Deliver, offering completely free registration for university students across Vietnam.",
    thumbnail: "/images/news/ttxvn.jpg",
    thumbnailAlt: "Launch of NextGen Manager 2026 competition by VNU-IS",
    hasFullText: false,
    author: "Viet Ha - VNA",
  },
];
