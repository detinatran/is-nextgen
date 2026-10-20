/**
 * Email cấp tài khoản thí sinh cho người đã đăng ký trước khi tài khoản được cấp tự động lúc nộp hồ sơ.
 * Cùng kiểu với email xác nhận đăng ký (khung xanh đậm, nền xanh nhạt, chữ Times New Roman).
 */
import { esc, FACEBOOK, vnDeadline, ZALO_GROUP } from './registration-confirmed';

export function accountReady(input: {
  fullName: string;
  candidateCode: string;
  email: string;
  site: string;
  hasVideo: boolean;
  videoDeadline?: string;
}): { subject: string; text: string; html: string } {
  const name = input.fullName.trim() || 'Bạn';
  const code = input.candidateCode;
  const site = input.site.replace(/\/$/, '');
  const host = site.replace(/^https?:\/\//, '');
  const deadline = input.videoDeadline ? vnDeadline(input.videoDeadline) : '';
  const needVideo = !input.hasVideo && !!deadline;
  const subject = 'NextGen Manager 2026: Tài khoản thí sinh của bạn';

  const text =
    `Thân gửi ${name},\n\n` +
    `Ban Tổ chức Cuộc thi "NextGen Manager 2026" - Shaping the AI-era Leader 2026 xin gửi tới bạn tài khoản thí sinh. Từ nay bạn có thể đăng nhập để theo dõi hồ sơ, nộp bổ sung video (nếu chưa nộp) và xem lịch thi Vòng 1 ngay khi Ban Tổ chức xếp ca.\n\n` +
    (code ? `Mã thí sinh của bạn: ${code}\n\n` : '') +
    `TÀI KHOẢN THÍ SINH\n` +
    `Tên đăng nhập: ${input.email} (hoặc mã thí sinh)\n` +
    `Bước 1: Kích hoạt tài khoản tại ${site}/thi/kich-hoat/ : nhập email này, nhận mã 6 số qua email và đặt mật khẩu.\n` +
    `Bước 2: Đăng nhập tại ${site}/thi/ để xem hồ sơ` +
    (needVideo ? `, nộp bổ sung video giới thiệu (hạn chót ${deadline})` : '') +
    ` và theo dõi lịch thi Vòng 1.\n\n` +
    `Mã 6 số có hiệu lực trong 15 phút; nếu không thấy email chứa mã, bạn kiểm tra thêm mục Spam/Quảng cáo.\n\n` +
    `Nhóm hỗ trợ thí sinh NextGen Manager 2026: ${ZALO_GROUP}\n\n` +
    `Trân trọng,\nBan Tổ chức NextGen Manager 2026\n\n` +
    `Thông tin liên hệ\n` +
    `Email: nextgen@vnuis.edu.vn\n` +
    `Facebook: Cuộc thi Nhà Quản trị thế hệ mới - Nextgen Manager (${FACEBOOK})\n` +
    `Hotline: Ms. Giang - 0388674655 · Ms. Thu - 0919746896`;

  const SERIF = "'Times New Roman',Times,Georgia,serif";
  const p = (inner: string, extra = '') =>
    `<p style="margin:0 0 22px;font-family:${SERIF};font-size:17px;line-height:1.5;color:#000000;text-align:justify;${extra}">${inner}</p>`;
  const b = (s: string) => `<strong>${s}</strong>`;
  const button = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;background:#274482;color:#ffffff;font-family:${SERIF};font-size:17px;font-weight:bold;text-decoration:none;padding:12px 26px;border-radius:6px;">${label}</a>`;
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;">Tài khoản thí sinh NextGen Manager 2026 của ${esc(name)} đã sẵn sàng – kích hoạt để đăng nhập.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#d5e7fd;border:10px solid #213560;">
  <tr><td style="padding:30px 28px 6px;">
    <a href="${site}/" style="display:block;border:2px solid #0b143a;"><img src="${site}/images/email/cover.jpg" width="580" alt="NextGen Manager 2026 – Shaping the AI-era Leader 2026" style="display:block;width:100%;height:auto;border:0;"></a>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    ${p(`<em>${b(`Thân gửi ${esc(name)},`)}</em>`)}
    ${p(`Ban Tổ chức Cuộc thi ${b('“NextGen Manager 2026” - Shaping the AI-era Leader 2026')} xin gửi tới bạn ${b('tài khoản thí sinh')}. Từ nay bạn có thể đăng nhập để theo dõi hồ sơ${needVideo ? ', nộp bổ sung video giới thiệu' : ''} và xem lịch thi Vòng 1 ngay khi Ban Tổ chức xếp ca.`)}
    <p style="margin:0 0 22px;font-family:${SERIF};font-size:20px;line-height:1.5;font-weight:bold;color:#274482;text-align:center;">TÀI KHOẢN THÍ SINH CỦA BẠN ĐÃ SẴN SÀNG</p>
    ${code ? `<p style="margin:0 0 22px;font-family:${SERIF};font-size:17px;line-height:1.6;color:#000000;text-align:center;">Mã thí sinh của bạn: <strong style="font-size:19px;color:#274482;letter-spacing:1px;">${esc(code)}</strong></p>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:#ffffff;border:2px solid #274482;"><tr><td style="padding:16px 18px;font-family:${SERIF};font-size:17px;line-height:1.55;color:#000000;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#274482;">TÀI KHOẢN THÍ SINH</p>
      <p style="margin:0 0 8px;">Tên đăng nhập: <strong>${esc(input.email)}</strong> (hoặc mã thí sinh)</p>
      <p style="margin:0 0 6px;"><strong>Bước 1:</strong> Kích hoạt tài khoản tại <a href="${site}/thi/kich-hoat/" style="color:#2854c4;">${host}/thi/kich-hoat</a>: nhập email này, nhận mã 6 số qua email và đặt mật khẩu.</p>
      <p style="margin:0;"><strong>Bước 2:</strong> Đăng nhập tại <a href="${site}/thi/" style="color:#2854c4;">${host}/thi</a> để xem hồ sơ${needVideo ? `, <strong>nộp bổ sung video giới thiệu (hạn chót ${esc(deadline)})</strong>` : ''} và theo dõi lịch thi Vòng 1.</p>
    </td></tr></table>
    <p style="margin:0 0 22px;text-align:center;">${button(`${site}/thi/kich-hoat/`, 'KÍCH HOẠT TÀI KHOẢN')}</p>
    ${p(`Mã 6 số có hiệu lực trong 15 phút. Nếu không thấy email chứa mã, bạn vui lòng kiểm tra thêm mục ${b('Spam/Quảng cáo')}.`)}
    ${p(`Mọi thông tin mới nhất của cuộc thi được cập nhật trong nhóm Zalo hỗ trợ thí sinh:`)}
    <p style="margin:0 0 22px;font-family:${SERIF};font-size:19px;line-height:1.5;text-align:center;"><a href="${ZALO_GROUP}" style="color:#2854c4;font-weight:bold;text-decoration:underline;">NHÓM HỖ TRỢ THÍ SINH NEXTGEN MANAGER 2026</a></p>
    ${p(`Trân trọng,<br>${b('Ban Tổ chức NextGen Manager 2026')}`, 'text-align:left;')}
    ${p(`${b('Thông tin liên hệ')}<br><em>${b('Email:')}</em> <a href="mailto:nextgen@vnuis.edu.vn" style="color:#2854c4;">nextgen@vnuis.edu.vn</a><br><em>${b('Facebook')}</em>: <a href="${FACEBOOK}" style="color:#2854c4;">Cuộc thi Nhà Quản trị thế hệ mới - Nextgen Manager</a><br><em>${b('Hotline:')}</em> Ms. Giang - 0388674655<br>Ms. Thu - 0919746896`, 'text-align:left;margin-bottom:8px;')}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}
