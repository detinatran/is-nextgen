# Kết quả kiểm tra phần Admin

## Kiểm tra bản merge vào main — 09/10/2026

Nhánh `feature/admin-fr-01-12` được merge vào `main` tại commit `5b6f4f2`, không có xung đột. `origin/main` tại thời điểm merge là `f7fd302`; các nhánh tính năng khác của nhóm chưa được gộp trong lần này.

- Frontend và backend: TypeScript, build thành công; backend ESLint không có cảnh báo.
- 20 kiểm thử đơn vị, 107 kiểm thử tích hợp PostgreSQL và 2 kiểm thử contract API đều đạt (129/129).
- Chrome chạy bản build sau merge: kiểm tra bảo vệ route, mật khẩu sai, đăng nhập và MFA, 9 màn hình Admin, tải Excel, form câu hỏi, từ chối file nhập lỗi, mobile 390 px, đăng xuất và từ chối cookie cũ đều đạt.
- Database kiểm thử riêng, không xoá dữ liệu ứng dụng local. Các fixture phát sinh trong kiểm thử contract đã được khôi phục, không đưa ID và thời gian ngẫu nhiên vào commit.

FR-12 vẫn cần công thức BCM chính thức để xác nhận cách tổng hợp điểm. Các kiểm thử hiện xác nhận công thức có trọng số đang được hỗ trợ, không xác nhận quy định BCM của Ban Tổ Chức.

## Kiểm tra trước merge

Ngày kiểm tra: 07/10/2026. Branch: `feature/admin-fr-01-12`.

- Frontend: TypeScript và build Next.js thành công.
- Backend: TypeScript, ESLint và build NestJS thành công.
- 20 kiểm thử đơn vị đạt.
- Toàn bộ 107 kiểm thử tích hợp của backend đạt với PostgreSQL thực, gồm kiểm thử Admin mới và các luồng thí sinh có sẵn.
- 2 kiểm thử contract API đạt. Kiểm thử nộp bài có sẵn đã được sửa để gửi `writerGeneration`, đúng DTO của backend.
- Sau lần rà soát cuối, chạy lại 8 kiểm thử Admin: tất cả đạt. Có kiểm tra thêm dòng lỗi sau dòng trống và từ chối đổi ca khi đã bắt đầu thi.
- Kiểm tra trình duyệt Chrome đạt: chặn truy cập chưa đăng nhập; mật khẩu sai; đăng nhập và MFA; 9 màn hình Admin; tải Excel; form câu hỏi; tệp nhập lỗi; giao diện rộng 390 px; đăng xuất và phát lại cookie cũ bị từ chối.

Database kiểm thử và database chạy thử local tách riêng. Phiên, mật khẩu và dữ liệu thử không được commit. `backend/.env`, `.data/`, `node_modules/` được Git bỏ qua.

## Điều còn cần xác nhận

FR-12 đã có nhập Excel giám khảo, kiểm tra mã thí sinh/đội, tiêu chí và thang điểm; cấu hình công thức theo phiên bản; bảng điểm chi tiết; xuất bảng tổng hợp. Công thức hiện hỗ trợ tổng tiêu chí theo trọng số, chuẩn hoá thang điểm, rồi lấy trung bình giám khảo.

Tab FR chỉ ghi “theo công thức BCM”, không cung cấp công thức, trọng số, cách tổng hợp giám khảo hay quy tắc đồng điểm. Chưa thể xác nhận FR-12 khớp quy định BCM chính thức. Cần công thức của Ban Tổ Chức để hoàn tất bước đối chiếu này; không tự gán trọng số thành quy định chính thức.

FR-10 không bật phần tuỳ chọn ghi chuyển tab/copy/paste. Bảng giám sát dùng trạng thái thật của bài thi và không hiển thị số sự kiện giả.

Chi tiết chạy dự án và định dạng mẫu: [admin-fr-01-12.md](admin-fr-01-12.md).
