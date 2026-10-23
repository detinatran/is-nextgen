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
  title: string;
  originalTitle: string;
  originalUrl: string;
  publishedAt: string;
  publishedDateLabel: string;
  summary: string;
  thumbnail: string;
  thumbnailAlt: string;
  hasFullText: boolean;
  author: string;
  sapo: string;
  sections: NewsSectionContent[];
}

interface SharedArticleMeta {
  id: string;
  slug: string;
  originalTitle: string;
  originalUrl: string;
  publishedAt: string;
  publishedDateLabel: string;
  thumbnail: string;
  author: string;
}

const sharedMeta: Record<string, SharedArticleMeta> = {
  giaoduc: {
    id: "giaoduc",
    slug: "giaoduc-sinh-vien-truong-quoc-te-dhqghn-thu-suc-voi-bai-toan-quan-tri-doanh-nghiep-trong-ky-nguyen-ai",
    originalTitle:
      "Sinh viên Trường Quốc tế - ĐHQGHN thử sức với bài toán quản trị doanh nghiệp trong kỷ nguyên AI",
    originalUrl:
      "https://giaoduc.net.vn/sinh-vien-truong-quoc-te-dhqghn-thu-suc-voi-bai-toan-quan-tri-doanh-nghiep-trong-ky-nguyen-ai-post263566.gd",
    publishedAt: "2026-10-23T09:11:51+07:00",
    publishedDateLabel: "23/10/2026 · 09:11",
    thumbnail: "/images/news/giaoduc.webp",
    author: "Tường San",
  },
  gdtd: {
    id: "gdtd",
    slug: "gdtd-tao-moi-truong-de-sinh-vien-nganh-kinh-te-ren-luyen-danh-gia-nang-luc",
    originalTitle:
      "Tạo môi trường để sinh viên ngành Kinh tế rèn luyện, đánh giá năng lực",
    originalUrl:
      "https://giaoducthoidai.vn/tao-moi-truong-de-sinh-vien-nganh-kinh-te-ren-luyen-danh-gia-nang-luc-post797032.html",
    publishedAt: "2026-10-23T07:22:00+07:00",
    publishedDateLabel: "23/10/2026 · 07:22",
    thumbnail: "/images/news/gdtd.webp",
    author: "Đức Duy",
  },
  vtcnews: {
    id: "vtcnews",
    slug: "vtcnews-bang-diem-dep-chua-du-sinh-vien-thu-suc-lam-nha-quan-tri-trong-ky-nguyen-ai",
    originalTitle:
      "Bảng điểm đẹp chưa đủ, sinh viên thử sức làm nhà quản trị trong kỷ nguyên AI",
    originalUrl:
      "https://vtcnews.vn/bang-diem-dep-chua-du-sinh-vien-thu-suc-lam-nha-quan-tri-trong-ky-nguyen-ai-ar1046722.html",
    publishedAt: "2026-10-23T00:06:53+07:00",
    publishedDateLabel: "23/10/2026 · 00:06",
    thumbnail: "/images/news/vtc.jpg",
    author: "Lệ Thu",
  },
  ttxvn: {
    id: "ttxvn",
    slug: "ttxvn-phat-dong-cuoc-thi-nha-quan-tri-the-he-moi-nextgen-manager-2026-danh-cho-sinh-vien-toan-quoc",
    originalTitle:
      "Phát động Cuộc thi Nhà Quản trị thế hệ mới - NextGen Manager 2026 dành cho sinh viên toàn quốc",
    originalUrl:
      "https://chinhsachcuocsong.vnanet.vn/phat-dong-cuoc-thi-nha-quan-tri-the-he-moi-nextgen-manager-2026-danh-cho-sinh-vien-toan-quoc/99546.html",
    publishedAt: "2026-10-22T22:12:00+07:00",
    publishedDateLabel: "22/10/2026 · 22:12",
    thumbnail: "/images/news/ttxvn.jpg",
    author: "Việt Hà",
  },
};

export const newsArticlesVi: NewsArticleItem[] = [
  {
    ...sharedMeta.giaoduc,
    title: sharedMeta.giaoduc.originalTitle,
    source: "Tạp chí điện tử Giáo dục Việt Nam",
    summary:
      "Sinh viên tiếp cận và thử sức với bài toán quản trị doanh nghiệp thực tế qua mô hình đánh giá năng lực hành vi Enterprise Assessment Center trong bối cảnh phát triển của trí tuệ nhân tạo.",
    thumbnailAlt:
      "Người tham dự chương trình chụp ảnh lưu niệm tại Lễ phát động NextGen Manager 2026.",
    hasFullText: true,
    sapo: "GDVN - Đến thời điểm phát động, Cuộc thi NextGen Manager 2026 mùa đầu tiên đã có hơn 100 sinh viên của Trường Quốc tế và nhiều cơ sở đào tạo khác đăng ký tham dự.",
    sections: [
      {
        type: "paragraph",
        content:
          "Ngày 22/10/2026, Khoa Kinh tế và Quản lý, Trường Quốc tế – Đại học Quốc gia Hà Nội cùng các đơn vị đồng hành tổ chức Lễ khai mạc và phát động Cuộc thi NextGen Manager 2026 mùa đầu tiên với chủ đề “Chân dung Nhà quản trị trong Kỷ nguyên AI”.",
      },
      {
        type: "paragraph",
        content:
          "Đây là cuộc thi dành cho sinh viên đầu tiên tại Việt Nam được xây dựng trên mô hình Enterprise Assessment Center.",
      },
      {
        type: "quote",
        content:
          "Enterprise Assessment Center là phương pháp các tập đoàn lớn sử dụng để tuyển chọn quản trị viên tập sự. Cuộc thi NextGen Manager 2026 đưa mô hình này vào môi trường đại học, đánh giá sinh viên theo khung sáu nhóm năng lực với đề bài do chính doanh nghiệp đồng hành đặt ra từ bài toán quản trị có thật.",
      },
      {
        type: "paragraph",
        content:
          "Buổi lễ có sự tham dự của Ban Giám hiệu Trường Quốc tế cùng đại diện lãnh đạo các phòng, khoa chuyên môn, cán bộ, giảng viên và sinh viên Nhà trường.",
      },
      {
        type: "paragraph",
        content:
          "Được biết, cuộc thi được thiết kế theo mô hình Enterprise Assessment Center – mô hình đánh giá thí sinh theo khung sáu nhóm năng lực, gồm: Tư duy phân tích và ra quyết định; Tư duy hệ thống và sắp xếp ưu tiên; Lãnh đạo và tạo ảnh hưởng; Hợp tác và giao tiếp; Đạo đức và trách nhiệm; Trình bày và ngôn ngữ. Trong đó, mỗi nhóm năng lực được mô tả bằng năm mức hành vi quan sát được.",
      },
      {
        type: "paragraph",
        content:
          "Tại vòng chung kết, thí sinh sẽ giải quyết đề bài do doanh nghiệp đồng hành xây dựng từ một bài toán quản trị có thật. Mỗi thí sinh vào vòng này được nhận báo cáo đánh giá năng lực cá nhân, dựa trên những hành vi thể hiện trong quá trình thực hiện nhiệm vụ và nhận xét của các cố vấn đến từ doanh nghiệp.",
      },
      {
        type: "heading",
        content: "Đánh giá những năng lực của sinh viên mà AI không thể làm thay",
      },
      {
        type: "paragraph",
        content:
          "Phát biểu khai mạc buổi lễ, Phó Giáo sư. Tiến sĩ Nguyễn Anh Tuấn – Hiệu trưởng Trường Quốc tế cho biết, Nhà trường đã xác định sứ mệnh đào tạo, nghiên cứu khoa học và chuyển giao công nghệ theo các tiêu chuẩn kiểm định quốc tế, dựa trên ba trụ cột.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-1.webp",
        caption:
          "Phó Giáo sư, Tiến sĩ Nguyễn Anh Tuấn – Hiệu trưởng Trường Quốc tế phát biểu khai mạc Lễ phát động cuộc thi.",
      },
      {
        type: "paragraph",
        content:
          "Đó là sáng tạo và chuyển giao tri thức cho người học để phụng sự xã hội; hoàn thành xuất sắc các nhiệm vụ Đại học Quốc gia Hà Nội giao; tự chủ tài chính. Cuộc thi NextGen Manager 2026 được định vị trong trụ cột thứ nhất.",
      },
      {
        type: "paragraph",
        content:
          "Đặc biệt, thầy Tuấn nhấn mạnh, có ba năng lực mà AI không làm thay được: đặt đúng câu hỏi – vì AI trả lời rất tốt câu hỏi được giao nhưng không biết câu hỏi ấy có đúng là vấn đề cần giải hay không; chịu trách nhiệm – vì AI đưa ra phương án nhưng không ký tên vào phương án ấy; và dẫn dắt được người khác đi cùng – vì một quyết định chỉ có giá trị khi có người thực hiện nó.",
      },
      {
        type: "paragraph",
        content:
          "Do đó, cuộc thi cho phép thí sinh sử dụng công cụ AI khi làm bài. Ban Tổ chức sẽ đo những năng lực AI không làm thay được, việc cho phép dùng AI càng làm lộ rõ ai thực sự có những năng lực đó. Thí sinh phải khai báo việc sử dụng công cụ, và chính cách khai báo ấy được tính điểm vào nhóm năng lực Đạo đức và trách nhiệm.",
      },
      {
        type: "paragraph",
        content:
          "“Chúng tôi làm cuộc thi này không phải vì AI đang là chủ đề thời sự, mà vì AI làm lộ rõ một khoảng trống vốn đã tồn tại”, Phó Giáo sư, Tiến sĩ Nguyễn Anh Tuấn nhấn mạnh.",
      },
      {
        type: "paragraph",
        content:
          "Theo thầy Tuấn, Trường Quốc tế có hơn 20.000 sinh viên đã tốt nghiệp, tỷ lệ có việc làm đúng chuyên ngành sau một năm đạt trên 93%. Tuy nhiên, kết quả tìm được việc chưa phản ánh đầy đủ khả năng phát triển nghề nghiệp lâu dài. Cuộc thi được kỳ vọng giúp sinh viên không chỉ tìm kiếm công việc phù hợp mà còn chuẩn bị năng lực để tiến xa hơn.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-2.webp",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-3.webp",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-4.webp",
        caption:
          "Lãnh đạo Trường Quốc tế trao hoa cảm ơn các đơn vị đồng hành và các chuyên gia tham gia chương trình.",
      },
      {
        type: "heading",
        content: "Ghép nhóm liên trường, mô phỏng môi trường làm việc thực tế",
      },
      {
        type: "paragraph",
        content:
          "Điểm đáng chú ý của cuộc thi này là không giới hạn trong không gian Đại học Quốc gia Hà Nội. Theo đó, Trường Quốc tế đã mời các cơ sở đào tạo, các trường đại học, các học viện trên cả nước cử sinh viên tham gia, hoàn toàn miễn phí dự thi.",
      },
      {
        type: "paragraph",
        content:
          "Đến thời điểm phát động, cuộc thi đã có hơn 100 sinh viên của Trường Đại học Ngoại thương, Trường Đại học Đại Nam, Đại học Kinh tế Quốc dân và một số cơ sở đào tạo khác đăng ký tham dự. Ngay từ Vòng 2, Ban Tổ chức ghép nhóm hỗn hợp giữa sinh viên các trường, các ngành và cả sinh viên quốc tế của VNU-IS, nhằm mô phỏng môi trường làm việc thực tế tại doanh nghiệp.",
      },
      {
        type: "paragraph",
        content:
          "Đánh giá cuộc thi, bà Nguyễn Thị Lan Ngọc, Giám đốc chi nhánh TPBank Hà Nội – đơn vị đồng hành cuộc thi bày tỏ, cuộc thi là cơ hội để doanh nghiệp tiếp cận và làm quen với nguồn nhân sự trẻ ngay từ sớm. Thực tế hiện nay, ngân hàng là một trong những ngành tiếp cận AI nhanh nhất và nhiều nhất.",
      },
      {
        type: "paragraph",
        content:
          "Từ kinh nghiệm làm việc, bà Ngọc cho rằng, khả năng phối hợp hiệu quả với những người không do mình lựa chọn là một kỹ năng quan trọng. Trong ngân hàng, nhân sự thường xuyên luân chuyển giữa các bộ phận, chi nhánh và phải nhanh chóng thích nghi với tập thể mới.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-5.webp",
        caption:
          "Bà Nguyễn Thị Lan Ngọc, Giám đốc chi nhánh TPBank Hà Nội – đại diện đơn vị đồng hành, phát biểu tại buổi lễ.",
      },
      {
        type: "paragraph",
        content:
          "Vì vậy, việc sinh viên được ghép nhóm với những người chưa quen, đến từ các trường và ngành học khác nhau sẽ tạo cơ hội rèn luyện kỹ năng giao tiếp, phân công công việc và giải quyết bất đồng.",
      },
      {
        type: "paragraph",
        content:
          "Bà Ngọc cũng bày tỏ ấn tượng với sự năng động, năng lực và kỹ năng làm việc của sinh viên Trường Quốc tế, đồng thời cho biết nhu cầu tìm kiếm nhân sự có năng lực quản trị là một trong những lý do TPBank đồng hành cùng cuộc thi.",
      },
      {
        type: "heading",
        content:
          "Giúp người học nhận diện điểm mạnh, khoảng trống năng lực và định hướng phát triển nghề nghiệp",
      },
      {
        type: "paragraph",
        content:
          "Đáng chú ý, trong khuôn khổ Lễ khai mạc, người tham dự được tham gia chương trình workshop với ba tham luận từ các chuyên gia trong lĩnh vực quản trị và phát triển nhân sự.",
      },
      {
        type: "paragraph",
        content:
          "Trong khuôn khổ lễ khai mạc, chương trình tọa đàm chuyên đề có ba tham luận về quản trị và phát triển nhân sự, mang đến góc nhìn từ các doanh nghiệp.",
      },
      {
        type: "paragraph",
        content:
          "Theo đó, bà Mai Thúy Hằng - Tổng Giám đốc MCG&Partners đã đề xuất mô hình 4A dành cho nhà quản lý thế hệ mới, gồm: am hiểu và làm việc hiệu quả với AI (AI Fluent); thích ứng nhanh (Adaptive); học hỏi liên tục (Agile Learner); lãnh đạo bằng sự chính trực (Authentic Leader).",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-6.webp",
        caption:
          "Bà Mai Thúy Hằng - Tổng Giám đốc MCG&Partners, chia sẻ tham luận về mô hình 4A cho nhà quản trị thế hệ mới.",
      },
      {
        type: "paragraph",
        content:
          "Dẫn các dữ liệu về sự thay đổi nghề nghiệp và nhu cầu kỹ năng AI, bà Hằng nhấn mạnh, lợi thế cạnh tranh bền vững không chỉ nằm ở ngành học hay công nghệ đang sử dụng, mà ở khả năng học hỏi nhanh hơn tốc độ thay đổi.",
      },
      {
        type: "paragraph",
        content:
          "Từ góc nhìn tuyển dụng, ông Đỗ Khắc Triệu - Trợ lý Tổng Giám đốc Talentnet lưu ý, hiệu suất cao không đồng nghĩa với tiềm năng cao. Người hoàn thành tốt công việc hiện tại chưa chắc đã sẵn sàng đảm nhiệm những vai trò mới nếu thiếu khả năng thích ứng và phát triển.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-7.webp",
        caption:
          "Ông Đỗ Khắc Triệu - Trợ lý Tổng Giám đốc Talentnet, chia sẻ về các tiêu chí tuyển dụng trong thời đại AI.",
      },
      {
        type: "paragraph",
        content:
          "Theo ông Triệu, nhà tuyển dụng không chỉ xem xét CV hay thành tích quá khứ mà còn đánh giá cách ứng viên xử lý tình huống thực tế. Một phương pháp được sử dụng là phỏng vấn hành vi theo mô hình STAR, gồm tình huống, nhiệm vụ, hành động và kết quả.",
      },
      {
        type: "paragraph",
        content:
          "Trong khi đó, bà Ngô Thị Duy Phương - Giám đốc Đào tạo Vinpearl – Tập đoàn Vingroup đã giới thiệu khung tư duy quản trị O.W.N.E.R với năm yếu tố: xác định mục tiêu; phân bổ nguồn lực; dẫn dắt phối hợp; đo lường, đánh giá; và bảo đảm kết quả có giá trị.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-8.webp",
        caption:
          "Bà Ngô Thị Duy Phương - Giám đốc Đào tạo Vinpearl – Tập đoàn Vingroup đã đúc kết khung tư duy quản trị O.W.N.E.R.",
      },
      {
        type: "paragraph",
        content:
          "Bà Phương đã chỉ ra ba sự dịch chuyển trong vai trò của nhà quản trị: từ người đưa ra câu trả lời sang người đặt đúng câu hỏi; từ kiểm soát từng việc sang thiết kế cách phối hợp giữa con người và AI; từ thúc đẩy năng suất sang bảo đảm kết quả tạo ra giá trị.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-9.webp",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-10.webp",
        caption:
          "Sinh viên sôi nổi đặt câu hỏi và giao lưu cùng các chuyên gia khách mời trong phần tọa đàm.",
      },
      {
        type: "paragraph",
        content:
          "Thông qua các bài toán thực tế, hoạt động phối hợp liên trường và phản hồi từ doanh nghiệp, Cuộc thi NextGen Manager 2026 mùa đầu tiên hướng tới tạo môi trường để sinh viên thử sức với vai trò quản trị ngay trên giảng đường. Kết quả đánh giá không chỉ phục vụ cuộc thi mà còn giúp người học nhận diện điểm mạnh, khoảng trống năng lực và định hướng phát triển nghề nghiệp.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-11.webp",
        caption:
          "Người tham dự chương trình chụp ảnh lưu niệm tại Lễ phát động NextGen Manager 2026.",
      },
    ],
  },
  {
    ...sharedMeta.gdtd,
    title: sharedMeta.gdtd.originalTitle,
    source: "Báo Giáo dục & Thời đại",
    summary:
      "Cuộc thi xây dựng môi trường học thuật thực chiến giúp sinh viên khối ngành Kinh tế rèn luyện, hoàn thiện sáu nhóm năng lực quản trị cốt lõi thông qua tình huống mô phỏng và đánh giá hành vi.",
    thumbnailAlt: "Quang cảnh buổi phát động.",
    hasFullText: true,
    sapo: "GD&TĐ - Trường Quốc tế, Đại học Quốc gia Hà Nội chính thức phát động Cuộc thi Nhà Quản trị thế hệ mới - NextGen Manager 2026.",
    sections: [
      {
        type: "image",
        src: "/images/news/gdtd-1.webp",
        caption: "Quang cảnh buổi phát động.",
      },
      {
        type: "paragraph",
        content:
          "Trong bối cảnh yêu cầu của thị trường lao động đối với sinh viên tốt nghiệp đang thay đổi nhanh chóng, đặc biệt khi trí tuệ nhân tạo ngày càng được ứng dụng rộng rãi. Cuộc thi hướng tới tạo môi trường để sinh viên rèn luyện, đánh giá năng lực quản trị thông qua các tình huống thực tiễn của doanh nghiệp.",
      },
      {
        type: "paragraph",
        content:
          "Bên cạnh đó thay vì chỉ đánh giá kiến thức, NextGen Manager tập trung vào những năng lực như tư duy phân tích, ra quyết định, sắp xếp ưu tiên, lãnh đạo, tạo ảnh hưởng, hợp tác, giao tiếp và trách nhiệm.",
      },
      {
        type: "paragraph",
        content:
          "Phát biểu tại lễ phát động, PGS.TS Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội, Trưởng Ban Tổ chức cuộc thi cho biết: Hằng năm, các trường thuộc khối kinh tế cung cấp cho thị trường lao động hàng nghìn cử nhân có kết quả học tập tốt. Tuy nhiên, những năng lực doanh nghiệp cần ở một quản trị viên trẻ như ra quyết định khi thông tin chưa đầy đủ, xác định thứ tự ưu tiên hay thuyết phục người khác khi chưa có quyền hạn lại khó có thể đo bằng bảng điểm.",
      },
      {
        type: "paragraph",
        content:
          "Theo PGS.TS Anh Tuấn, sự phát triển của trí tuệ nhân tạo càng làm rõ khoảng trống này.",
      },
      {
        type: "paragraph",
        content:
          "Trí tuệ nhân tạo đã nâng mức sàn đầu ra của công việc, vì vậy, yếu tố tạo nên sự khác biệt ngày càng chuyển sang những năng lực mà máy móc khó thay thế. Vấn đề đặt ra không chỉ là đào tạo được những năng lực đó mà còn phải có phương thức đánh giá mức độ người học đã hình thành và làm chủ các năng lực.",
      },
      {
        type: "paragraph",
        content:
          "Một trong những điểm khác biệt của NextGen Manager 2026 là cuộc thi được xây dựng trên mô hình Enterprise Assessment Center - phương pháp được các tập đoàn sử dụng trong tuyển chọn quản trị viên tập sự. Thí sinh được đánh giá theo sáu nhóm năng lực gồm: tư duy phân tích và ra quyết định; tư duy hệ thống và sắp xếp ưu tiên; lãnh đạo và tạo ảnh hưởng; hợp tác và giao tiếp; đạo đức và trách nhiệm; trình bày và ngôn ngữ. Mỗi nhóm năng lực được mô tả bằng năm mức hành vi có thể quan sát.",
      },
      {
        type: "paragraph",
        content:
          "Đáng chú ý, đề bài tại vòng Chung kết do doanh nghiệp đồng hành đưa ra từ những bài toán quản trị thực tế. Mỗi thí sinh vào Chung kết sẽ nhận được báo cáo đánh giá năng lực cá nhân dựa trên hành vi từ các cố vấn đến từ doanh nghiệp, qua đó nhận diện điểm mạnh, những năng lực còn thiếu và có định hướng tiếp tục rèn luyện.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi cho phép thí sinh được phép kết hợp công nghệ thông minh để tra cứu, đồng thời khai thác tối đa khả năng suy luận và sáng tạo của chính bạn. Doanh nghiệp đồng hành theo sát bài làm, giám khảo chấm theo khung năng lực hành vi.",
      },
      {
        type: "paragraph",
        content:
          "Làm rõ quy định này, PGS.TS Nguyễn Anh Tuấn cho rằng, có ba năng lực máy không làm thay được: Đặt đúng câu hỏi; Chịu trách nhiệm; Dẫn dắt được người khác đi cùng.",
      },
      {
        type: "paragraph",
        content:
          "Vì vậy cuộc thi cho phép thí sinh sử dụng công cụ AI khi làm bài. Đây là lựa chọn chủ động chứ không phải nhân nhượng, chính vì chúng tôi đo những năng lực AI không làm thay được, cho phép dùng AI càng làm lộ rõ ai thực sự có những năng lực đó.",
      },
      {
        type: "paragraph",
        content:
          "“Thí sinh phải khai báo việc sử dụng công cụ, và chính cách khai báo ấy được tính điểm vào nhóm năng lực đạo đức và trách nhiệm”, ông Tuấn cho hay.",
      },
      {
        type: "image",
        src: "/images/news/gdtd-2.webp",
        caption:
          "PGS.TS Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi gồm ba vòng DISCOVER - DECIDE - DELIVER, tương ứng với ba năng lực cơ bản của nhà quản trị là hiểu vấn đề, ra quyết định và tạo ra kết quả.",
      },
      {
        type: "paragraph",
        content:
          "Vòng 1 - DISCOVER diễn ra ngày 7/11, gồm phần video trình bày và bài trắc nghiệm tư duy nhà quản trị, lựa chọn 40 thí sinh.",
      },
      {
        type: "paragraph",
        content:
          "Vòng 2 - DECIDE diễn ra ngày 21/11 với hình thức thảo luận nhóm không có người dẫn. Các thí sinh chưa từng làm việc cùng nhau sẽ giải quyết một tình huống thực tiễn của doanh nghiệp; giám khảo quan sát, ghi nhận hành vi để đánh giá khả năng đặt câu hỏi, tháo gỡ bế tắc, kết nối thành viên và dẫn dắt nhóm đạt kết quả.",
      },
      {
        type: "paragraph",
        content:
          "Đêm Chung kết - DELIVER dự kiến diễn ra ngày 5/12. Bốn đội sẽ giải quyết đề bài do doanh nghiệp đặt ra và bảo vệ phương án trước Hội đồng giám khảo, sau đó 6 thí sinh tiếp tục tham gia phần thi cá nhân. Cách thiết kế này nhằm đánh giá riêng năng lực làm việc nhóm và năng lực ra quyết định độc lập của người dự thi.",
      },
      {
        type: "paragraph",
        content:
          "Ngay từ vòng 2, Ban Tổ chức sẽ ghép các nhóm gồm sinh viên đến từ những trường, ngành khác nhau và sinh viên quốc tế, tạo môi trường làm việc đa dạng tương tự thực tế tại doanh nghiệp. Ban Tổ chức định hướng đưa NextGen Manager trở thành cuộc thi thường niên, từng bước hình thành kênh để nhà trường và doanh nghiệp cùng xây dựng khung năng lực quản trị cho các nhà quản lý trẻ.",
      },
      {
        type: "paragraph",
        content:
          "Bên cạnh ba vòng thi, chương trình có hoạt động trải nghiệm thực tế tại doanh nghiệp và kết nối thí sinh với lãnh đạo doanh nghiệp, chuyên gia, qua đó mở rộng cơ hội thực tập, tuyển dụng.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi có 8 giải thưởng, tổng giá trị giải thưởng tại thời điểm phát động hơn 100 triệu đồng, trong đó có các cơ hội thực tập hoặc làm việc trực tiếp tại doanh nghiệp.",
      },
      {
        type: "quote",
        content:
          "Cổng đăng ký tham dự cuộc thi mở đến hết ngày 31/10/2026. Cuộc thi được mở rộng cho sinh viên các cơ sở giáo dục đại học, trường đại học, học viện trong và ngoài Đại học Quốc gia Hà Nội, không thu phí dự thi.",
      },
    ],
  },
  {
    ...sharedMeta.vtcnews,
    title: sharedMeta.vtcnews.originalTitle,
    source: "Báo điện tử VTC News",
    sourceRole: "Bảo trợ truyền thông",
    summary:
      "Khẳng định những năng lực thiết yếu mà doanh nghiệp tìm kiếm ở nhà quản trị trẻ ngoài bảng điểm: khả năng ra quyết định khi thiếu thông tin, lựa chọn thứ tự ưu tiên và tinh thần trách nhiệm.",
    thumbnailAlt:
      "PGS.TS Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội phát biểu khai mạc cuộc thi Nhà quản trị thế hệ mới 2026.",
    hasFullText: true,
    sapo: '(VTC News) - Tối 22/10, Trường Quốc tế, Đại học Quốc gia Hà Nội tổ chức lễ khai mạc và phát động Cuộc thi "Nhà quản trị thế hệ mới". mùa I năm học 2026-2027.',
    sections: [
      {
        type: "paragraph",
        content:
          "Cuộc thi NextGen Manager 2026 với chủ đề “Chân dung nhà quản trị trong kỷ nguyên AI” hướng tới sinh viên hệ đại học tại các trường đại học, học viện trong và ngoài Đại học Quốc gia Hà Nội, nhằm tạo cơ hội rèn luyện, đánh giá những năng lực quản trị mà doanh nghiệp quan tâm, từ tư duy phân tích, ra quyết định đến lãnh đạo, hợp tác và chịu trách nhiệm.",
      },
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
        src: "/images/news/vtc-1.png",
        caption:
          "PGS.TS Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội phát biểu khai mạc cuộc thi Nhà quản trị thế hệ mới 2026.",
      },
      {
        type: "paragraph",
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
        type: "image",
        src: "/images/news/vtc-2.png",
        caption: "Đông đảo sinh viên trong và ngoài trường quan tâm cuộc thi.",
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
        type: "image",
        src: "/images/news/vtc-3.png",
        caption: "Đại diện nhà trường, doanh nghiệp cùng phát động cuộc thi.",
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
    ...sharedMeta.ttxvn,
    title: sharedMeta.ttxvn.originalTitle,
    source: "Chính sách và Cuộc sống — TTXVN",
    summary:
      "Lễ phát động toàn quốc cuộc thi NextGen Manager 2026 với hành trình ba vòng Discover – Decide – Deliver, mở rộng cơ hội tham gia hoàn toàn miễn phí cho sinh viên các trường đại học trên cả nước.",
    thumbnailAlt: "Quang cảnh lễ phát động. Ảnh: Việt Hà - TTXVN",
    hasFullText: true,
    sapo: "Cuộc thi gồm ba vòng Discover - Decide - Deliver, tương ứng với ba năng lực cơ bản của nhà quản trị là hiểu vấn đề, ra quyết định và tạo ra kết quả.",
    sections: [
      {
        type: "image",
        src: "/images/news/ttxvn-1.jpg",
        caption: "Quang cảnh lễ phát động. Ảnh: Việt Hà - TTXVN",
      },
      {
        type: "paragraph",
        content:
          "Tối 22/10, tại Hà Nội, Trường Quốc tế, Đại học Quốc gia Hà Nội phát động Cuộc thi Nhà Quản trị thế hệ mới - NextGen Manager 2026, hướng tới tạo môi trường để sinh viên rèn luyện, đánh giá năng lực quản trị thông qua các tình huống thực tiễn của doanh nghiệp.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi được tổ chức trong bối cảnh yêu cầu của thị trường lao động đối với sinh viên tốt nghiệp đang thay đổi nhanh chóng, đặc biệt khi trí tuệ nhân tạo ngày càng được ứng dụng rộng rãi. NextGen Manager 2026 tập trung vào những năng lực như tư duy phân tích, ra quyết định, sắp xếp ưu tiên, lãnh đạo, tạo ảnh hưởng, hợp tác, giao tiếp và trách nhiệm.",
      },
      {
        type: "paragraph",
        content:
          "Phát biểu tại lễ phát động, Phó Giáo sư, Tiến sĩ Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội, Trưởng Ban Tổ chức cuộc thi cho biết: Hằng năm, các trường thuộc khối kinh tế cung cấp cho thị trường lao động hàng nghìn cử nhân có kết quả học tập tốt. Tuy nhiên, những năng lực doanh nghiệp cần ở một quản trị viên trẻ như ra quyết định khi thông tin chưa đầy đủ, xác định thứ tự ưu tiên hay thuyết phục người khác khi chưa có quyền hạn lại khó có thể đo bằng bảng điểm.",
      },
      {
        type: "paragraph",
        content:
          "Theo Phó Giáo sư, Tiến sĩ Nguyễn Anh Tuấn, sự phát triển của trí tuệ nhân tạo ngày càng làm rõ khoảng trống này. Trí tuệ nhân tạo đã nâng mức sàn đầu ra của công việc, vì vậy, yếu tố tạo nên sự khác biệt ngày càng chuyển sang những năng lực mà máy móc khó thay thế. Vấn đề đặt ra không chỉ là đào tạo được những năng lực đó mà còn phải có phương thức đánh giá mức độ người học đã hình thành và làm chủ các năng lực.",
      },
      {
        type: "image",
        src: "/images/news/ttxvn-2.jpg",
        caption:
          "Phó Giáo sư, Tiến sĩ Nguyễn Anh Tuấn, Hiệu trưởng Trường Quốc tế, Đại học Quốc gia Hà Nội, Trưởng Ban Tổ chức cuộc thi phát biểu tại lễ phát động. Ảnh: Việt Hà - TTXVN",
      },
      {
        type: "paragraph",
        content:
          "Một trong những điểm khác biệt của NextGen Manager 2026 là cuộc thi được xây dựng trên mô hình Enterprise Assessment Center - phương pháp được các tập đoàn sử dụng trong tuyển chọn quản trị viên tập sự. Thí sinh được đánh giá theo 6 nhóm năng lực gồm: Tư duy phân tích và ra quyết định; tư duy hệ thống và sắp xếp ưu tiên; lãnh đạo và tạo ảnh hưởng; hợp tác và giao tiếp; đạo đức và trách nhiệm; trình bày và ngôn ngữ. Mỗi nhóm năng lực được mô tả bằng năm mức hành vi có thể quan sát.",
      },
      {
        type: "paragraph",
        content:
          "Đáng chú ý, đề bài tại vòng Chung kết do doanh nghiệp đồng hành đưa ra từ những bài toán quản trị thực tế. Mỗi thí sinh vào Chung kết sẽ nhận được báo cáo đánh giá năng lực cá nhân dựa trên hành vi từ các cố vấn đến từ doanh nghiệp, qua đó nhận diện điểm mạnh, những năng lực còn thiếu và có định hướng tiếp tục rèn luyện.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi dành cho sinh viên các cơ sở giáo dục đại học trên cả nước, không thu phí dự thi. Ngay từ vòng 2, Ban tổ chức sẽ ghép các nhóm gồm sinh viên đến từ những trường, ngành khác nhau và sinh viên quốc tế, tạo môi trường làm việc đa dạng tương tự thực tế tại doanh nghiệp.",
      },
      {
        type: "paragraph",
        content:
          "Theo Ban tổ chức, cuộc thi gồm ba vòng Discover - Decide - Deliver, tương ứng với ba năng lực cơ bản của nhà quản trị là hiểu vấn đề, ra quyết định và tạo ra kết quả.",
      },
      {
        type: "paragraph",
        content:
          "Vòng 1 - Discover diễn ra ngày 7/11, gồm phần video trình bày và bài trắc nghiệm tư duy nhà quản trị, lựa chọn 40 thí sinh. Vòng 2 - Decide diễn ra ngày 21/11 với hình thức thảo luận nhóm không có người dẫn. Các thí sinh chưa từng làm việc cùng nhau sẽ giải quyết một tình huống thực tiễn của doanh nghiệp; giám khảo quan sát, ghi nhận hành vi để đánh giá khả năng đặt câu hỏi, tháo gỡ bế tắc, kết nối thành viên và dẫn dắt nhóm đạt kết quả.",
      },
      {
        type: "paragraph",
        content:
          "Đêm Chung kết - Deliver dự kiến diễn ra ngày 5/12. Bốn đội sẽ giải quyết đề bài do doanh nghiệp đặt ra và bảo vệ phương án trước Hội đồng giám khảo, sau đó 6 thí sinh tiếp tục tham gia phần thi cá nhân. Cách thiết kế này nhằm đánh giá riêng năng lực làm việc nhóm và năng lực ra quyết định độc lập của người dự thi.",
      },
      {
        type: "paragraph",
        content:
          "Bên cạnh ba vòng thi, chương trình có hoạt động trải nghiệm thực tế tại doanh nghiệp và kết nối thí sinh với lãnh đạo doanh nghiệp, chuyên gia, qua đó mở rộng cơ hội thực tập, tuyển dụng.",
      },
      {
        type: "paragraph",
        content:
          "Cuộc thi có cơ cấu 8 giải thưởng: 1 giải Nhất, 1 giải Nhì, 1 giải Ba, 3 giải Khuyến khích, 1 giải Nhóm xuất sắc nhất và 1 giải Cá nhân được yêu thích nhất. Tổng giá trị giải thưởng tại thời điểm phát động là hơn 100 triệu đồng, trong đó có các cơ hội thực tập hoặc làm việc trực tiếp tại doanh nghiệp. Cổng đăng ký tham dự cuộc thi mở đến hết ngày 31/10/2026.",
      },
      {
        type: "paragraph",
        content:
          "Trường Quốc tế, Đại học Quốc gia Hà Nội định hướng đưa NextGen Manager trở thành cuộc thi thường niên, từng bước hình thành kênh để nhà trường và doanh nghiệp cùng xây dựng khung năng lực quản trị cho các nhà quản lý trẻ./.",
      },
    ],
  },
];

export const newsArticlesEn: NewsArticleItem[] = [
  {
    ...sharedMeta.giaoduc,
    title:
      "VNU International School students tackle enterprise management challenges in the AI era",
    source: "Vietnam Education Electronic Magazine (Giáo dục Việt Nam)",
    summary:
      "Students tackle real-world enterprise management challenges assessed through the Enterprise Assessment Center behavioral model, fostering strategic leadership in the era of artificial intelligence.",
    thumbnailAlt:
      "Participants take a commemorative photo at the NextGen Manager 2026 launch ceremony.",
    hasFullText: true,
    sapo: "GDVN - By the time of its official launch, the inaugural season of NextGen Manager 2026 had already attracted more than 100 registered students from VNU International School and numerous other higher education institutions.",
    sections: [
      {
        type: "paragraph",
        content:
          "On October 22, 2026, the Faculty of Economics and Management at VNU International School (Vietnam National University, Hanoi), together with partner organizations, held the opening and launch ceremony of the first season of NextGen Manager 2026 under the theme “Portrait of a Manager in the AI Era”.",
      },
      {
        type: "paragraph",
        content:
          "This is the first student competition in Vietnam built upon the Enterprise Assessment Center model.",
      },
      {
        type: "quote",
        content:
          "Enterprise Assessment Center is the methodology used by major corporations to select management trainees. NextGen Manager 2026 brings this model into the university environment, evaluating students across six competency groups through real-world business problems set directly by partner companies.",
      },
      {
        type: "paragraph",
        content:
          "The ceremony was attended by the Board of Rectors of VNU International School, leaders of functional departments and academic faculties, staff, lecturers, and students.",
      },
      {
        type: "paragraph",
        content:
          "The competition is designed around the Enterprise Assessment Center framework, evaluating candidates across six core competency groups: Analytical Thinking & Decision-Making; Systems Thinking & Prioritization; Leadership & Influence; Collaboration & Communication; Ethics & Responsibility; and Presentation & Language. Each competency group is described through five observable behavioral levels.",
      },
      {
        type: "paragraph",
        content:
          "In the Grand Finale, contestants will solve a case study built by partner companies from a real management problem. Every finalist receives a personalized competency assessment report based on observable behaviors during task execution and feedback from corporate mentors.",
      },
      {
        type: "heading",
        content: "Assessing student competencies that AI cannot replace",
      },
      {
        type: "paragraph",
        content:
          "Speaking at the opening ceremony, Assoc. Prof. Dr. Nguyễn Anh Tuấn – Rector of VNU International School stated that the School defines its mission around training, scientific research, and technology transfer according to international accreditation standards, built upon three pillars.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-1.webp",
        caption:
          "Assoc. Prof. Dr. Nguyễn Anh Tuấn – Rector of VNU International School delivers the opening address at the launch ceremony.",
      },
      {
        type: "paragraph",
        content:
          "These three pillars are creating and transferring knowledge to learners to serve society; excellently fulfilling tasks assigned by Vietnam National University, Hanoi; and financial autonomy. NextGen Manager 2026 is positioned within the first pillar.",
      },
      {
        type: "paragraph",
        content:
          "In particular, Assoc. Prof. Dr. Tuấn emphasized three capabilities that AI cannot replace: asking the right question – because AI answers assigned prompts well but cannot judge whether that question addresses the true problem; taking responsibility – because AI proposes options but never signs its name to a decision; and leading others – because a decision only holds value when people carry it forward together.",
      },
      {
        type: "paragraph",
        content:
          "Therefore, the competition allows contestants to use AI tools during their work. The Organizing Committee measures the capabilities AI cannot substitute, and permitting AI usage makes it even clearer who genuinely possesses those human leadership qualities. Contestants must declare how they use AI tools, and that declaration is scored within the Ethics & Responsibility competency group.",
      },
      {
        type: "paragraph",
        content:
          "“We created this competition not because AI is a trending topic, but because AI exposes a gap that has long existed,” Assoc. Prof. Dr. Nguyễn Anh Tuấn emphasized.",
      },
      {
        type: "paragraph",
        content:
          "According to Assoc. Prof. Dr. Tuấn, VNU International School has more than 20,000 alumni, with over 93% employed in their field of study within one year of graduation. However, initial employment alone does not fully reflect long-term career advancement potential. The competition is expected to help students not only secure suitable jobs but also build the competencies needed to go further.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-2.webp",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-3.webp",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-4.webp",
        caption:
          "Leaders of VNU International School present flowers to thank partner organizations and expert speakers participating in the program.",
      },
      {
        type: "heading",
        content:
          "Cross-university team formation simulating real corporate environments",
      },
      {
        type: "paragraph",
        content:
          "A notable highlight of the competition is that it extends beyond Vietnam National University, Hanoi. VNU International School has invited higher education institutions, universities, and academies nationwide to nominate students with zero registration fees.",
      },
      {
        type: "paragraph",
        content:
          "By the launch date, over 100 students from Foreign Trade University, Dai Nam University, National Economics University, and other institutions had already registered. Starting from Round 2, the Organizing Committee forms mixed teams combining students from different universities, majors, and international students at VNU-IS to simulate real-world corporate diversity.",
      },
      {
        type: "paragraph",
        content:
          "Evaluating the competition, Ms. Nguyễn Thị Lan Ngọc, Director of TPBank Hanoi Branch – a partner company, shared that the competition offers businesses an early opportunity to connect with young talent. Today, banking is among the sectors adopting AI fastest and most extensively.",
      },
      {
        type: "paragraph",
        content:
          "From her practical experience, Ms. Ngọc noted that collaborating effectively with people one did not personally choose is a vital skill. In banking, personnel frequently rotate across departments and branches and must quickly adapt to new teams.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-5.webp",
        caption:
          "Ms. Nguyễn Thị Lan Ngọc, Director of TPBank Hanoi Branch – partner representative, speaks at the ceremony.",
      },
      {
        type: "paragraph",
        content:
          "Therefore, grouping students with unfamiliar peers from diverse universities and disciplines provides valuable practice in communication, task delegation, and conflict resolution.",
      },
      {
        type: "paragraph",
        content:
          "Ms. Ngọc also expressed her impression of the dynamism, capability, and work ethic of VNU International School students, noting that the demand for young talent with managerial aptitude is a key reason TPBank partnered with the competition.",
      },
      {
        type: "heading",
        content:
          "Helping learners identify strengths, competency gaps, and career directions",
      },
      {
        type: "paragraph",
        content:
          "Within the framework of the Opening Ceremony, participants attended a specialized workshop featuring three presentations from experts in management and human resource development.",
      },
      {
        type: "paragraph",
        content:
          "The thematic panel discussion brought practical corporate perspectives on leadership and talent development.",
      },
      {
        type: "paragraph",
        content:
          "Ms. Mai Thúy Hằng – CEO of MCG&Partners proposed the 4A model for next-generation managers: AI Fluent (understanding and working effectively with AI); Adaptive (adapting rapidly); Agile Learner (continuous learning); and Authentic Leader (leading with integrity).",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-6.webp",
        caption:
          "Ms. Mai Thúy Hằng – CEO of MCG&Partners shares her presentation on the 4A model for next-generation managers.",
      },
      {
        type: "paragraph",
        content:
          "Citing data on career shifts and AI skill demands, Ms. Hằng emphasized that sustainable competitive advantage lies not merely in one's major or current technology, but in the ability to learn faster than the pace of change.",
      },
      {
        type: "paragraph",
        content:
          "From a recruitment perspective, Mr. Đỗ Khắc Triệu – Assistant to the CEO of Talentnet noted that high current performance does not automatically equate to high potential. Someone excelling in their present role may not be ready for new responsibilities without adaptability and growth capacity.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-7.webp",
        caption:
          "Mr. Đỗ Khắc Triệu – Assistant to the CEO of Talentnet shares insights on recruitment criteria in the AI era.",
      },
      {
        type: "paragraph",
        content:
          "According to Mr. Triệu, recruiters look beyond CVs or past achievements to evaluate how candidates handle real-life situations, frequently using STAR behavioral interviewing (Situation, Task, Action, Result).",
      },
      {
        type: "paragraph",
        content:
          "Meanwhile, Ms. Ngô Thị Duy Phương – Training Director at Vinpearl (Vingroup) introduced the O.W.N.E.R management mindset framework comprising five elements: defining objectives; allocating resources; leading coordination; measuring and evaluating; and ensuring valuable outcomes.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-8.webp",
        caption:
          "Ms. Ngô Thị Duy Phương – Training Director at Vinpearl (Vingroup) presents the O.W.N.E.R management framework.",
      },
      {
        type: "paragraph",
        content:
          "Ms. Phương highlighted three shifts in the role of a manager: from providing answers to asking the right questions; from micromanaging tasks to designing human–AI collaboration; and from driving output volume to ensuring value creation.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-9.webp",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-10.webp",
        caption:
          "Students actively ask questions and engage with guest experts during the panel discussion.",
      },
      {
        type: "paragraph",
        content:
          "Through real business problems, cross-university collaboration, and direct corporate feedback, the inaugural NextGen Manager 2026 competition creates a platform for students to experience management roles while still in university. The assessment results not only serve the competition but also help learners identify their strengths, skill gaps, and long-term career paths.",
      },
      {
        type: "image",
        src: "/images/news/giaoduc-11.webp",
        caption:
          "Participants take a commemorative photo at the NextGen Manager 2026 launch ceremony.",
      },
    ],
  },
  {
    ...sharedMeta.gdtd,
    title:
      "Creating an environment for Economics students to practice and assess managerial competencies",
    source: "Education & Times Newspaper (Giáo dục & Thời đại)",
    summary:
      "An experiential academic platform enabling economics students to hone and refine six core managerial competencies through practical simulation scenarios and behavioral assessments.",
    thumbnailAlt: "Overview of the launch ceremony.",
    hasFullText: true,
    sapo: "GD&TĐ - VNU International School (Vietnam National University, Hanoi) officially launched the NextGen Manager 2026 competition.",
    sections: [
      {
        type: "image",
        src: "/images/news/gdtd-1.webp",
        caption: "Overview of the launch ceremony.",
      },
      {
        type: "paragraph",
        content:
          "Organized amidst rapidly changing labor market demands for graduates—especially as artificial intelligence becomes increasingly widespread—the competition aims to create an environment where students can practice and evaluate managerial competencies through real-world business scenarios.",
      },
      {
        type: "paragraph",
        content:
          "Rather than testing theoretical knowledge alone, NextGen Manager focuses on competencies such as analytical thinking, decision-making, prioritization, leadership, influence, collaboration, communication, and responsibility.",
      },
      {
        type: "paragraph",
        content:
          "Speaking at the launch ceremony, Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School and Head of the Organizing Committee, stated: Every year, economics universities supply the labor market with thousands of graduates with strong academic transcripts. However, the competencies businesses need in a young manager—such as making decisions with incomplete information, setting priorities, or persuading others without formal authority—are difficult to measure through grades alone.",
      },
      {
        type: "paragraph",
        content:
          "According to Assoc. Prof. Dr. Nguyễn Anh Tuấn, the rapid advancement of artificial intelligence makes this gap even more evident.",
      },
      {
        type: "paragraph",
        content:
          "Artificial intelligence has raised the baseline output of work, shifting true differentiation toward capabilities that machines cannot easily replace. The challenge is not only training those competencies but also establishing reliable methods to measure how well learners have developed and mastered them.",
      },
      {
        type: "paragraph",
        content:
          "A distinctive feature of NextGen Manager 2026 is its foundation on the Enterprise Assessment Center model—the methodology used by major corporations to select management trainees. Contestants are evaluated across six competency groups: analytical thinking and decision-making; systems thinking and prioritization; leadership and influence; collaboration and communication; ethics and responsibility; and presentation and language. Each competency group is defined across five observable behavioral levels.",
      },
      {
        type: "paragraph",
        content:
          "Notably, the Grand Finale case study is provided directly by partner companies based on real management challenges. Every finalist receives an individual behavioral competency assessment report from corporate mentors, helping them identify strengths, address gaps, and plan further development.",
      },
      {
        type: "paragraph",
        content:
          "The competition allows contestants to combine smart technology for research while maximizing their own reasoning and creativity. Partner businesses closely follow the submissions, and judges evaluate candidates according to the behavioral competency framework.",
      },
      {
        type: "paragraph",
        content:
          "Clarifying this rule, Assoc. Prof. Dr. Nguyễn Anh Tuấn noted that there are three capabilities machines cannot replace: Asking the right question; Taking responsibility; and Leading others forward together.",
      },
      {
        type: "paragraph",
        content:
          "Therefore, the competition permits contestants to use AI tools during their work. This is a deliberate choice rather than a concession: precisely because the competition measures capabilities AI cannot replace, allowing AI makes it even clearer who truly possesses those competencies.",
      },
      {
        type: "paragraph",
        content:
          "“Contestants must declare their tool usage, and the way they declare it is scored under the ethics and responsibility competency group,” Assoc. Prof. Dr. Tuấn shared.",
      },
      {
        type: "image",
        src: "/images/news/gdtd-2.webp",
        caption:
          "Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School, Vietnam National University, Hanoi.",
      },
      {
        type: "paragraph",
        content:
          "The competition consists of three rounds—DISCOVER, DECIDE, and DELIVER—corresponding to three fundamental requirements of a manager: understanding problems, making decisions, and delivering results.",
      },
      {
        type: "paragraph",
        content:
          "Round 1 – DISCOVER takes place on November 7, featuring a video presentation and an online managerial thinking test to select the top 40 contestants.",
      },
      {
        type: "paragraph",
        content:
          "Round 2 – DECIDE takes place on November 21 in a leaderless group discussion format. Contestants who have never worked together solve a practical corporate case study while judges observe and record behaviors to evaluate how they ask questions, resolve deadlocks, connect teammates, and guide the group toward results.",
      },
      {
        type: "paragraph",
        content:
          "The Grand Finale – DELIVER is scheduled for December 5. Four teams solve a real business problem posed by partner companies and defend their proposals before the judging panel, after which the top 6 contestants advance to an individual round. This structure separately evaluates teamwork capability and independent decision-making.",
      },
      {
        type: "paragraph",
        content:
          "Starting from Round 2, the Organizing Committee forms mixed teams of students from different universities, majors, and international students, creating a diverse working environment similar to real enterprises. VNU International School aims to make NextGen Manager an annual competition, building a bridge for universities and businesses to co-develop management competency frameworks for young leaders.",
      },
      {
        type: "paragraph",
        content:
          "Alongside the three competition rounds, the program features corporate field trips and networking events connecting contestants with business leaders and experts, expanding internship and recruitment opportunities.",
      },
      {
        type: "paragraph",
        content:
          "The competition features 8 awards with a total prize value exceeding VND 100 million at launch, including direct internship and employment opportunities at partner companies.",
      },
      {
        type: "quote",
        content:
          "Registration is open until the end of October 31, 2026. The competition is open to undergraduate students from universities and academies both within and outside Vietnam National University, Hanoi, with no participation fee.",
      },
    ],
  },
  {
    ...sharedMeta.vtcnews,
    title:
      "Good transcripts are not enough: students test their mettle as managers in the AI era",
    source: "VTC News Online (Báo điện tử VTC News)",
    sourceRole: "Official Media Partner",
    summary:
      "Highlighting essential qualities that employers look for in young leaders beyond academic transcripts: decision-making under uncertainty, prioritization, and professional accountability.",
    thumbnailAlt:
      "Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School, delivers the opening speech at NextGen Manager 2026.",
    hasFullText: true,
    sapo: '(VTC News) - On the evening of October 22, VNU International School (Vietnam National University, Hanoi) held the opening and launch ceremony of the "NextGen Manager" competition, Season I, academic year 2026–2027.',
    sections: [
      {
        type: "paragraph",
        content:
          "With the theme “Portrait of a Manager in the AI Era”, NextGen Manager 2026 targets undergraduate students across universities and academies inside and outside Vietnam National University, Hanoi, offering an opportunity to practice and assess the managerial competencies employers value—from analytical thinking and decision-making to leadership, collaboration, and accountability.",
      },
      {
        type: "heading",
        content:
          "Assessing managerial competencies instead of looking only at academic transcripts",
      },
      {
        type: "paragraph",
        content:
          "Speaking at the opening ceremony, Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School (Vietnam National University, Hanoi) and Head of the Organizing Committee, stated that the School defines its mission as training, scientific research, and technology transfer in accordance with international accreditation standards, supplying high-quality human resources and scientific-technological products.",
      },
      {
        type: "paragraph",
        content:
          "This mission rests on three pillars: creating and transferring knowledge and skills to learners to serve society; excellently fulfilling missions assigned by Vietnam National University, Hanoi; and financial autonomy.",
      },
      {
        type: "paragraph",
        content:
          "The “NextGen Manager” competition is positioned within the first pillar, stemming from the requirement to link academic training with real-world practice and transfer actionable skills to learners.",
      },
      {
        type: "paragraph",
        content:
          "According to Assoc. Prof. Dr. Tuấn, economics institutions graduate thousands of bachelor's degree holders with impressive transcripts every year, yet what businesses need in a young manager is precisely what transcripts cannot measure: making decisions when information is incomplete, setting work priorities, and persuading others without formal authority.",
      },
      {
        type: "image",
        src: "/images/news/vtc-1.png",
        caption:
          "Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School, Vietnam National University, Hanoi delivers the opening speech at NextGen Manager 2026.",
      },
      {
        type: "paragraph",
        content:
          "“Artificial intelligence makes that gap more visible than ever: AI raises the baseline floor of work output, shifting true differentiation to the exact areas machines cannot do for us. Teaching those competencies is one thing; measuring how far they have been learned is even harder,” Mr. Tuấn said.",
      },
      {
        type: "paragraph",
        content:
          "A notable highlight of NextGen Manager 2026 is the application of the “Enterprise Assessment Center” model, an evaluation methodology widely used in corporate management recruitment and leadership development.",
      },
      {
        type: "heading",
        content: "Three competition rounds, six competency groups",
      },
      {
        type: "paragraph",
        content:
          "The Organizing Committee established an assessment framework comprising six competency groups: analytical thinking and decision-making; systems thinking and prioritization; leadership and influence; collaboration and communication; ethics and responsibility; and presentation and language. Each group is described across five observable behavioral levels.",
      },
      {
        type: "paragraph",
        content:
          "According to Dr. Tạ Huy Hùng, Deputy Head of the Organizing Committee and Vice Dean of the Faculty of Economics and Management at VNU International School, the competition features three rounds named Discover, Decide, and Deliver, corresponding to three fundamental demands of management: understanding the problem, making decisions, and delivering results.",
      },
      {
        type: "paragraph",
        content:
          "Round 1 – Discover takes place on November 7, 2026. Contestants submit a two-minute video on a chosen topic and complete an online managerial thinking test. The Organizing Committee expects to select 40 contestants for the next round.",
      },
      {
        type: "paragraph",
        content:
          "Round 2 – Decide takes place on November 21, 2026, using a leaderless group discussion format. Contestants are randomly grouped to solve a practical corporate case study together. No team leader is appointed; judges observe how each member contributes, resolves deadlocks, and collaborates to bring the team to a solution. Following this round, 16 contestants advance to the Grand Finale.",
      },
      {
        type: "image",
        src: "/images/news/vtc-2.png",
        caption:
          "A large number of students from inside and outside the university show strong interest in the competition.",
      },
      {
        type: "paragraph",
        content:
          "Round 3 – Deliver is scheduled for December 5, 2026. Teams solve real business challenges set by partner companies, presenting and defending their solutions before the judging panel. Subsequently, the six best contestants compete in an individual round to demonstrate independent managerial problem-solving.",
      },
      {
        type: "paragraph",
        content:
          "Alongside the three competition rounds, the program includes the NextGen Business Field Trip on November 14, giving contestants first-hand exposure to corporate environments, and the NextGen Gala Dinner Networking on November 28, connecting students with business leaders and industry experts.",
      },
      {
        type: "paragraph",
        content:
          "Each round is independently scored by at least two judges from the university and partner enterprises; significant score discrepancies are reviewed and re-evaluated. Notably, contestants are permitted to use AI during the competition. According to the Organizing Committee, this reflects modern workplace reality while focusing evaluation on capabilities technology cannot fully replace—such as framing the right problem, taking accountability for decisions, and collaborating with people.",
      },
      {
        type: "heading",
        content: "Partner companies directly set challenges and evaluate contestants",
      },
      {
        type: "paragraph",
        content:
          "A key differentiator is that the Grand Finale case study is authored by partner companies from real-world management problems. Students thus apply their knowledge to concrete corporate challenges rather than textbook hypotheticals. Partner companies also co-develop problems, serve on the judging panel, and open doors for students to experience real workplace environments.",
      },
      {
        type: "paragraph",
        content:
          "The total prize value exceeds VND 100 million across eight awards: First, Second, and Third Prizes, three Consolation Prizes, Best Team Award, and Most Popular Individual Award. Prizes include cash, trophies, certificates, scholarships, and internship or employment opportunities at partner enterprises selected by the judging panel.",
      },
      {
        type: "image",
        src: "/images/news/vtc-3.png",
        caption:
          "University and corporate representatives jointly launch the competition.",
      },
      {
        type: "paragraph",
        content:
          "According to the Organizing Committee, the competition is envisioned as an annual nationwide event not limited to Vietnam National University, Hanoi. Students from universities and academies across the country can register free of charge. Registration at nextgen.vnuis.edu.vn closes at the end of October 31, 2026.",
      },
      {
        type: "paragraph",
        content:
          "Through the competition, VNU International School expects to strengthen ties between higher education and industry while helping students recognize the gap between academic knowledge and real-world management demands, empowering them to proactively build their competency roadmap before entering the labor market.",
      },
    ],
  },
  {
    ...sharedMeta.ttxvn,
    title:
      "Nationwide launch of NextGen Manager 2026 competition for university students",
    source: "Policy & Life — Vietnam News Agency (TTXVN)",
    summary:
      "Nationwide launch of NextGen Manager 2026 with its three-round journey Discover – Decide – Deliver, offering completely free registration for university students across Vietnam.",
    thumbnailAlt: "Overview of the launch ceremony. Photo: Việt Hà - TTXVN",
    hasFullText: true,
    sapo: "The competition consists of three rounds—Discover, Decide, and Deliver—corresponding to the three core competencies of a manager: understanding problems, making decisions, and delivering results.",
    sections: [
      {
        type: "image",
        src: "/images/news/ttxvn-1.jpg",
        caption: "Overview of the launch ceremony. Photo: Việt Hà - TTXVN",
      },
      {
        type: "paragraph",
        content:
          "On the evening of October 22 in Hanoi, VNU International School (Vietnam National University, Hanoi) launched the NextGen Manager 2026 competition, aiming to create an environment for students to practice and assess managerial competencies through real-world corporate scenarios.",
      },
      {
        type: "paragraph",
        content:
          "The competition is organized as labor market requirements for university graduates evolve rapidly, especially with the widespread adoption of artificial intelligence. NextGen Manager 2026 focuses on core competencies including analytical thinking, decision-making, prioritization, leadership, influence, collaboration, communication, and responsibility.",
      },
      {
        type: "paragraph",
        content:
          "Speaking at the launch ceremony, Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School and Head of the Organizing Committee, shared: Every year, economics schools supply the labor market with thousands of graduates with strong academic records. However, the competencies businesses need in a young manager—such as making decisions with incomplete information, setting priorities, or persuading others without formal authority—are difficult to measure by grades alone.",
      },
      {
        type: "paragraph",
        content:
          "According to Assoc. Prof. Dr. Nguyễn Anh Tuấn, the rise of artificial intelligence makes this gap increasingly clear. AI has raised the baseline floor of work output, shifting differentiation toward capabilities that machines cannot easily replace. The challenge is not only training those competencies but also assessing the extent to which learners have formed and mastered them.",
      },
      {
        type: "image",
        src: "/images/news/ttxvn-2.jpg",
        caption:
          "Assoc. Prof. Dr. Nguyễn Anh Tuấn, Rector of VNU International School and Head of the Organizing Committee, speaks at the launch ceremony. Photo: Việt Hà - TTXVN",
      },
      {
        type: "paragraph",
        content:
          "One of the key differentiators of NextGen Manager 2026 is that it is built upon the Enterprise Assessment Center model—the methodology used by major corporations to select management trainees. Contestants are evaluated across six competency groups: Analytical thinking and decision-making; systems thinking and prioritization; leadership and influence; collaboration and communication; ethics and responsibility; and presentation and language. Each competency group is described through five observable behavioral levels.",
      },
      {
        type: "paragraph",
        content:
          "Notably, the Grand Finale challenge is set directly by partner companies from real management problems. Each finalist receives an individual behavioral competency assessment report from corporate mentors, helping them identify strengths, address gaps, and orient their ongoing development.",
      },
      {
        type: "paragraph",
        content:
          "The competition is open to undergraduate students nationwide with no registration fee. Starting from Round 2, the Organizing Committee forms mixed teams of students from different universities, majors, and international students, creating a diverse working environment mirroring real corporate settings.",
      },
      {
        type: "paragraph",
        content:
          "According to the Organizing Committee, the competition comprises three rounds—Discover, Decide, and Deliver—corresponding to the three fundamental capabilities of a manager: understanding problems, making decisions, and delivering results.",
      },
      {
        type: "paragraph",
        content:
          "Round 1 – Discover takes place on November 7, featuring a video presentation and an online managerial thinking test to select 40 contestants. Round 2 – Decide takes place on November 21 in a leaderless group discussion format. Contestants who have never worked together solve a real corporate case study while judges observe and record behaviors to assess their ability to ask questions, break deadlocks, connect members, and lead the group to results.",
      },
      {
        type: "paragraph",
        content:
          "The Grand Finale – Deliver is scheduled for December 5. Four teams solve a business challenge posed by partner enterprises and defend their proposals before the judging panel, after which 6 contestants advance to an individual round. This design separately evaluates teamwork capability and independent decision-making.",
      },
      {
        type: "paragraph",
        content:
          "Alongside the three competition rounds, the program features corporate field trips and networking events connecting contestants with business leaders and experts, expanding internship and recruitment opportunities.",
      },
      {
        type: "paragraph",
        content:
          "The competition offers 8 awards: 1 First Prize, 1 Second Prize, 1 Third Prize, 3 Consolation Prizes, 1 Best Team Award, and 1 Most Popular Individual Award. The total prize value at launch exceeds VND 100 million, including direct internship and employment opportunities at partner enterprises. Registration is open until the end of October 31, 2026.",
      },
      {
        type: "paragraph",
        content:
          "VNU International School, Vietnam National University, Hanoi aims to establish NextGen Manager as an annual competition, gradually building a collaborative channel for universities and businesses to co-develop management competency frameworks for young leaders./.",
      },
    ],
  },
];
