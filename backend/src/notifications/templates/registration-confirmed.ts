/**
 * Email xác nhận đăng ký thành công, theo mẫu Ban Tổ chức (Google Docs "Mail xác nhận đki thành công NextGen Manager", tab final).
 * "Thân gửi Bạn" thay bằng họ tên thí sinh; bổ sung mã thí sinh và hướng dẫn tài khoản thi.
 * HTML dùng bảng + style inline để hiển thị đúng trên Gmail, Outlook, ứng dụng điện thoại.
 */

const ZALO_GROUP = 'https://zalo.me/g/cnqpuuocmir8cd1xzxpv';
const FACEBOOK = 'https://www.facebook.com/profile.php?id=61595115537350';
const LAUNCH_TIME = '18h30 ngày 22/10/2026';
const LAUNCH_PLACE = 'Phòng 512 - 514 số 1 Phan Tây Nhạc, Nam Từ Liêm';


function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function registrationConfirmed(input: { fullName: string; candidateCode: string; site: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const name = input.fullName.trim() || 'Bạn';
  const code = input.candidateCode;
  const site = input.site.replace(/\/$/, '');
  const subject = 'NextGen Manager 2026: Xác nhận đăng ký thành công';

  const text =
    `Thân gửi ${name},\n\n` +
    `Lời đầu tiên, Ban Tổ chức Cuộc thi "NextGen Manager 2026" - Shaping the AI-era Leader 2026 xin gửi lời cảm ơn chân thành đến bạn vì đã quan tâm và đăng ký tham gia chương trình năm nay.\n\n` +
    `"NextGen Manager 2026" là cuộc thi học thuật dành cho sinh viên đam mê lĩnh vực quản trị và điều hành tổ chức. Không chỉ mang đến một sân chơi học thuật thực chiến, chương trình còn mở ra cơ hội kết nối mạng lưới doanh nghiệp uy tín, phát triển kỹ năng nghiệp vụ chuyên môn và nhận được những suất thực tập giá trị. "NextGen Manager 2026" hứa hẹn sẽ mang đến một bệ phóng toàn diện, giúp thế hệ trẻ tương lai rèn luyện bản lĩnh và tư duy nhạy bén để bứt phá trong kỷ nguyên mới.\n\n` +
    `Và Ban Tổ chức rất vui mừng thông báo với bạn:\n\n` +
    `CHÚC MỪNG BẠN ĐÃ ĐĂNG KÝ THAM GIA THÀNH CÔNG CUỘC THI NEXTGEN MANAGER 2026\n\n` +
    (code ? `Mã thí sinh của bạn: ${code}\n` : '') +
    `Tài khoản thi và lịch thi Vòng 1 sẽ được gửi qua email này trước ngày thi; bạn làm theo hướng dẫn trong email để kích hoạt tài khoản tại ${site}/thi/kich-hoat/.\n\n` +
    `Để đồng hành cùng bạn trong suốt cuộc thi, Ban Tổ chức đã lập nhóm Zalo hỗ trợ thí sinh. Bạn vui lòng tham gia nhóm để cập nhật thông tin mới nhất của cuộc thi tại đây:\n` +
    `NHÓM HỖ TRỢ THÍ SINH NEXTGEN MANAGER 2026: ${ZALO_GROUP}\n\n` +
    `Ban Tổ chức xin chúc bạn sẽ luôn giữ vững tinh thần chủ động, bản lĩnh và tự tin trong suốt hành trình sắp tới. Đồng thời, để hỗ trợ thí sinh trang bị kiến thức và kỹ năng cần thiết trước khi bước vào vòng thi, Ban Tổ chức trân trọng thông báo về buổi Lễ phát động Cuộc thi với sự tham gia của các quý diễn giả giàu kinh nghiệm.\n\n` +
    `Thông tin buổi Lễ phát động:\n` +
    `Thời gian: ${LAUNCH_TIME}\n` +
    `Địa điểm: ${LAUNCH_PLACE}\n\n` +
    `Đặc biệt, toàn bộ thông tin trọng tâm về thể lệ cùng những góc nhìn chiến lược thực chiến sẽ được hé lộ và giải đáp trực tiếp tại Lễ phát động. Vì vậy, Ban Tổ chức yêu cầu 100% thí sinh tham dự đầy đủ và đúng giờ để nắm vững định hướng triển khai và chuẩn bị tốt cho các vòng thi.\n\n` +
    `Trân trọng,\nBan Tổ chức NextGen Manager 2026\n\n` +
    `Thông tin liên hệ\n` +
    `Email: nextgen@vnuis.edu.vn\n` +
    `Facebook: Cuộc thi Nhà Quản trị thế hệ mới - Nextgen Manager (${FACEBOOK})\n` +
    `Hotline: Ms. Giang - 0388674655 · Ms. Thu - 0919746896`;

  // Kiểu dáng theo mẫu Ban Tổ chức: khung viền xanh đậm, nền xanh nhạt, chữ Times New Roman canh đều
  const SERIF = "'Times New Roman',Times,Georgia,serif";
  const p = (inner: string, extra = '') =>
    `<p style="margin:0 0 22px;font-family:${SERIF};font-size:17px;line-height:1.5;color:#000000;text-align:justify;${extra}">${inner}</p>`;
  const b = (s: string) => `<strong>${s}</strong>`;
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;">Chúc mừng ${esc(name)} đã đăng ký thành công NextGen Manager 2026${code ? ` – mã thí sinh ${code}` : ''}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#d5e7fd;border:10px solid #213560;">
  <tr><td style="padding:30px 28px 6px;">
    <a href="${site}/" style="display:block;border:2px solid #0b143a;"><img src="${site}/images/email/cover.jpg" width="580" alt="NextGen Manager 2026 – Shaping the AI-era Leader 2026" style="display:block;width:100%;height:auto;border:0;"></a>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    ${p(`<em>${b(`Thân gửi ${esc(name)},`)}</em>`)}
    ${p(`Lời đầu tiên, Ban Tổ chức Cuộc thi ${b('“NextGen Manager 2026”- Shaping the AI-era Leader 2026')} xin gửi lời cảm ơn chân thành đến bạn vì đã quan tâm và đăng ký tham gia chương trình năm nay.`)}
    ${p(`${b('“NextGen Manager 2026”')} là cuộc thi học thuật dành cho sinh viên đam mê lĩnh vực quản trị và điều hành tổ chức. Không chỉ mang đến một sân chơi học thuật thực chiến, chương trình còn mở ra cơ hội kết nối mạng lưới doanh nghiệp uy tín, phát triển kỹ năng nghiệp vụ chuyên môn và nhận được những suất thực tập giá trị. ${b('“NextGen Manager 2026”')} hứa hẹn sẽ mang đến một bệ phóng toàn diện, giúp thế hệ trẻ tương lai rèn luyện bản lĩnh và tư duy nhạy bén để bứt phá trong kỷ nguyên mới.`, 'text-indent:20px;')}
    ${p('Và Ban Tổ chức rất vui mừng thông báo với bạn:')}
    <p style="margin:0 0 22px;font-family:${SERIF};font-size:20px;line-height:1.5;font-weight:bold;color:#274482;text-align:center;">CHÚC MỪNG BẠN ĐÃ ĐĂNG KÝ THAM GIA THÀNH CÔNG CUỘC THI NEXTGEN MANAGER 2026</p>
    ${code ? `<p style="margin:0 0 22px;font-family:${SERIF};font-size:17px;line-height:1.6;color:#000000;text-align:center;">Mã thí sinh của bạn: <strong style="font-size:19px;color:#274482;letter-spacing:1px;">${esc(code)}</strong><br><em>Tài khoản thi và lịch thi Vòng 1 sẽ được gửi qua email này trước ngày thi. Bạn làm theo hướng dẫn trong email đó để kích hoạt tài khoản tại <a href="${site}/thi/kich-hoat/" style="color:#2854c4;">${site.replace(/^https?:\/\//, '')}/thi</a>.</em></p>` : ''}
    ${p(`Để đồng hành cùng bạn trong suốt cuộc thi, Ban Tổ chức đã lập nhóm Zalo hỗ trợ thí sinh. ${b('Bạn vui lòng tham gia nhóm để cập nhật thông tin mới nhất của cuộc thi')} tại đây:`)}
    <p style="margin:0 0 22px;font-family:${SERIF};font-size:19px;line-height:1.5;text-align:center;"><a href="${ZALO_GROUP}" style="color:#2854c4;font-weight:bold;text-decoration:underline;">NHÓM HỖ TRỢ THÍ SINH NEXTGEN MANAGER 2026</a></p>
    ${p(`Ban Tổ chức xin chúc bạn sẽ luôn giữ vững tinh thần chủ động, bản lĩnh và tự tin trong suốt hành trình sắp tới. Đồng thời, để hỗ trợ thí sinh trang bị kiến thức và kỹ năng cần thiết trước khi bước vào vòng thi, Ban Tổ chức trân trọng thông báo về ${b('buổi Lễ phát động Cuộc thi')} với sự tham gia của các quý diễn giả giàu kinh nghiệm.`)}
    ${p(`${b('Thông tin buổi Lễ phát động:')}<br>${b(`Thời gian: ${LAUNCH_TIME}`)}<br>${b(`Địa điểm: ${LAUNCH_PLACE}`)}`, 'text-align:left;')}
    ${p(`Đặc biệt, toàn bộ thông tin trọng tâm về thể lệ cùng những góc nhìn chiến lược thực chiến sẽ được hé lộ và giải đáp trực tiếp tại Lễ phát động. Vì vậy, Ban tổ chức yêu cầu ${b('100% thí sinh')} tham dự đầy đủ và đúng giờ để nắm vững định hướng triển khai và chuẩn bị tốt cho các vòng thi.`)}
    ${p(`Trân trọng,<br>${b('Ban Tổ chức NextGen Manager 2026')}`, 'text-align:left;')}
    ${p(`${b('Thông tin liên hệ')}<br><em>${b('Email:')}</em> <a href="mailto:nextgen@vnuis.edu.vn" style="color:#2854c4;">nextgen@vnuis.edu.vn</a><br><em>${b('Facebook')}</em>: <a href="${FACEBOOK}" style="color:#2854c4;">Cuộc thi Nhà Quản trị thế hệ mới - Nextgen Manager</a><br><em>${b('Hotline:')}</em> Ms. Giang - 0388674655<br>Ms. Thu - 0919746896`, 'text-align:left;margin-bottom:8px;')}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}
