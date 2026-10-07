# IS-NextGen Manager Challenge 2026

**Website chính thức + Phân hệ Admin Dashboard** cho cuộc thi **IS-NextGen Manager Challenge 2026 – "The Manager in the AI Era" (Mùa I)**, do Khoa Kinh tế và Quản lý, Trường Quốc tế – Đại học Quốc gia Hà Nội tổ chức.

---

## 🏗️ Kiến trúc dự án

```
is-nextgen/
├── 🌐 Landing Page (Public)          → Next.js 16 App Router, Static Export (out/)
├── 🔐 Admin Dashboard (Private)      → Next.js 16 App Router, Client Components, i18n (VI/EN)
└── 📦 Shared Config                  → Tailwind CSS 4, TypeScript, Be Vietnam Pro font
```

| Phân hệ | Tech Stack | Deploy Target |
|---------|------------|---------------|
| **Landing Page** | Next.js 16 (Static Export), Tailwind CSS 4, GSAP | GitHub Pages / Vercel / Netlify / Hosting Trường |
| **Admin Dashboard** | Next.js 16 (App Router), React 19, Tailwind CSS 4, GSAP, i18n | Vercel / Node.js Server / Docker |

---

## 🚀 Chạy thử nhanh

```bash
# Cài đặt dependencies
npm install

# Chạy development (cả 2 phân hệ)
npm run dev        # http://localhost:3000

# Build production
npm run build      # Landing Page → out/ | Admin → .next/
```

> **Lưu ý**: Admin Dashboard chạy ở `/admin` (route group `(dashboard)`), Landing Page ở `/`.

---

## 📱 Landing Page (Public) - `/`

Trang giới thiệu cuộc thi, bao gồm:

| Đường dẫn | Nội dung |
|-----------|----------|
| `/` | Hero, chủ đề, 4 vòng thi, giá trị cốt lõi, khung năng lực, lộ trình, giải thưởng, đối tác, FAQ |
| `/the-le/` | Thể lệ chi tiết: đối tượng, từng vòng, khung năng lực, nguyên tắc chấm, lịch trình |
| `/ket-qua/` | Kết quả các vòng (đọc từ `public/data/results.json` hoặc Google Sheet) |
| `/dang-ky/` | Form đăng ký thí sinh (gửi Google Sheet qua Apps Script) |

### 📝 Sửa nội dung Landing Page

| Muốn sửa | File |
|----------|------|
| Chữ, số liệu, vòng thi, giải thưởng, lộ trình, FAQ, hạn đăng ký, liên hệ | `src/content/site.ts` |
| Logo nhà tài trợ | Thêm file vào `public/images/sponsors/` → khai báo trong `site.ts` |
| Kết quả vòng thi (không cần rebuild) | `public/data/results.json` hoặc Google Sheet |
| Màu sắc, font, design tokens | `src/app/globals.css` (`@theme` block) |
| Banner, logo, ảnh tổ chức | `public/images/` (banner.webp, logo.png, organizers.png) |

> Các chỗ cần Ban Tổ chức điền có ghi chú `TODO(BTC)` trong `site.ts`.

---

## 🛡️ Admin Dashboard (Private) - `/admin`

Phân hệ quản trị đầy đủ cho Ban Tổ Chức, được xây dựng độc lập (isolation) khỏi Landing Page.

### 🎯 Tính năng chính (Roadmap Completed)

| Giai đoạn | Module | Route | Mô tả |
|-----------|--------|-------|-------|
| **1** | Foundation & Auth | `/admin/login`, `/admin` | Đăng nhập MFA, Session HttpOnly, Layout Shell (Sidebar + Header), i18n VI/EN |
| **2** | Quản lý Thí sinh | `/admin/candidates` | CRUD hồ sơ, tìm kiếm đa tiêu chí, Drawer chi tiết, Video player ≤2p, Duyệt trùng lặp |
| | | `/admin/candidates/duplicate-reviews` | Rà soát hồ sơ nghi trùng lặp (email/SĐT/MSSV) |
| **3** | Ngân hàng Đề thi & Ca thi | `/admin/questions` | CRUD câu hỏi, độ khó, pool, freeze version |
| | | `/admin/questions/import` | Import hàng loạt Excel/Docx + validate syntax |
| | | `/admin/exams/schedules` | Quản lý ca thi Vòng 1 (60p, capacity 50-100) |
| | | `/admin/exams/assignments` | Phân ca thí sinh, lịch sử đổi ca, kiểm soát sức chứa |
| **4** | Giám sát & Chấm Vòng 1 | `/admin/exams/monitor` | Live dashboard realtime (heartbeat 5s), anti-cheat (tab switch, paste), cảnh cáo/cưỡng chế/đình chỉ |
| | | `/admin/scoring/round-1` | Bảng điểm tự động, leaderboard, tie-break, xuất CSV, phê duyệt TOP 40 |
| **5** | Chấm Rubric & Chung kết | `/admin/scoring/manual` | Rubric 6 nhóm năng lực × 5 mức, 2-3 giám khảo, tự động phát hiện lệch >20% → mời GK3, duyệt điểm, xuất TOP 16/12 |

### 🎨 Design System (Minimalist-UI)

- **Màu thương hiệu**: Navy Deep `#071533`, Navy `#0B1F4D`, Brand Blue `#1F5BE0`, Gold `#F5B83D`, Orange `#F26B1D`
- **Typography**: `Be_Vietnam_Pro` (weights 400-700), `tabular-nums` cho số liệu
- **Components**: `AdminTable`, `AdminButton`, `AdminBadge`, `AdminModal`, `AdminDrawer`, `AdminPopconfirm`, `AdminCard`, `BulkActionBar`, `Toast`, `AdminLangSwitch`
- **Status Badges**: Soft-pill (DRAFT/ACTIVE/FROZEN/WARNING/DISABLED với semantic colors)

### 🌐 i18n (Vietnamese / English)

```tsx
// Sử dụng hook trong mọi component admin
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function MyComponent() {
  const { t, lang, setLang, toggleLang } = useAdminI18n();
  return <button onClick={toggleLang}>{t("Tiếng Việt")} / {t("English")}</button>;
}
```

- Translation keys = chuỗi tiếng Việt gốc (xem `src/lib/i18n/admin-translations.ts`)
- Language persistence: `localStorage` key `admin-lang`
- Switcher: `AdminLangSwitch` component trong Header

### 📁 Cấu trúc Admin

```
src/
├── app/admin/
│   ├── (auth)/login/page.tsx              # Login page (MFA ready)
│   ├── (dashboard)/
│   │   ├── AdminShellClient.tsx           # Client shell (Sidebar + Header + i18n + Toast)
│   │   ├── layout.tsx                     # Server Component (metadata only)
│   │   ├── page.tsx                       # Dashboard KPI + Quick Actions
│   │   ├── candidates/
│   │   │   ├── page.tsx                   # Danh sách + tìm kiếm + Bulk actions
│   │   │   └── duplicate-reviews/page.tsx # Rà soát trùng lặp
│   │   ├── questions/
│   │   │   ├── page.tsx                   # Ngân hàng câu hỏi (CRUD, freeze)
│   │   │   └── import/page.tsx            # Import Excel/Docx + validate
│   │   ├── exams/
│   │   │   ├── schedules/page.tsx         # Quản lý ca thi
│   │   │   ├── assignments/page.tsx       # Phân ca thí sinh
│   │   │   └── monitor/page.tsx           # Live proctoring dashboard
│   │   └── scoring/
│   │       ├── round-1/page.tsx           # Bảng điểm Vòng 1 + TOP 40
│   │       └── manual/page.tsx            # Chấm Rubric Vòng 2/3/Chung kết
│   └── layout.tsx                         # Root admin layout
├── components/admin/
│   ├── layout/
│   │   ├── AdminSidebar.tsx               # Navigation (collapsible, mobile drawer)
│   │   └── AdminHeader.tsx                # Breadcrumb, Live indicator, Lang switch, Profile
│   ├── candidate/
│   │   ├── CandidateDetailDrawer.tsx      # Xem chi tiết hồ sơ + video
│   │   ├── VideoReviewModal.tsx           # Phát video giới thiệu ≤2p
│   │   └── DuplicateDiffModal.tsx         # So sánh hồ sơ trùng lặp side-by-side
│   └── ui/
│       ├── AdminTable.tsx                 # Data table (sort, paginate, select, animate)
│       ├── AdminButton.tsx                # Variants: brand/outline/ghost/danger
│       ├── AdminBadge.tsx                 # Variants: success/warning/danger/info/default/gold
│       ├── AdminModal.tsx                 # Modal với GSAP animation
│       ├── AdminPopconfirm.tsx            # Confirm dialog (render prop pattern)
│       ├── AdminInput.tsx / AdminSelect.tsx
│       ├── AdminCard.tsx                  # Variants: default/elevated/outlined/metric/interactive
│       ├── BulkActionBar.tsx              # Fixed bottom bar khi chọn nhiều dòng
│       ├── Toast.tsx / ToastProvider.tsx  # Toast notification system
│       └── AdminLangSwitch.tsx            # Language switcher (VI/EN)
├── mocks/admin/                           # Mock data cho development
│   ├── candidates.ts, duplicates.ts, questions.ts
│   ├── schedules.ts, assignments.ts, live-monitor.ts
│   ├── scoring-round1.ts, scoring-manual.ts
│   └── index.ts
├── types/admin.ts                         # 100% mapping PostgreSQL schema (001_schema_v1.sql)
└── lib/i18n/
    ├── AdminI18nContext.tsx               # Provider + hook useAdminI18n()
    ├── admin-translations.ts              # VI → EN dictionary
    └── index.ts
```

---

## 🔧 Biến môi trường

Tạo file `.env.local` từ `.env.example`:

```env
# Landing Page - Form đăng ký
NEXT_PUBLIC_REGISTER_ENDPOINT=https://script.google.com/macros/s/.../exec
NEXT_PUBLIC_RESULTS_CSV_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv

# Deploy config
NEXT_PUBLIC_BASE_PATH=/is-nextgen          # GitHub Pages project page
NEXT_PUBLIC_SITE_URL=https://is-nextgen.vn # Open Graph, sitemap
```

---

## 📦 Dependencies chính

| Package | Phân hệ | Mục đích |
|---------|---------|----------|
| `next@16.3.8` | Cả 2 | App Router, Static Export, Turbopack |
| `react@19.3.0` | Cả 2 | React 19 features |
| `tailwindcss@4.3.3` | Cả 2 | Utility-first CSS, `@theme` design tokens |
| `@gsap/react@2.1.2`, `gsap@3.15.0` | Admin + Landing | Animations (scroll, entrance, modal, drawer) |
| `clsx@2.1.1`, `tailwind-merge@3.7.0` | Cả 2 | ClassName merging utility (`cn()`) |

---

## 🧪 Mock Data & Development

Admin Dashboard dùng **Mock Data** tại `src/mocks/admin/` để phát triển độc lập khỏi Backend (NestJS + PostgreSQL). Khi kết nối BE:

1. Thay thế import từ `@/mocks/admin` bằng API calls (React Query / SWR)
2. Types đã sẵn sàng tại `src/types/admin.ts` (mapping 1-1 schema SQL)
3. API contracts: RESTful + Server-side Session (HttpOnly cookie, CSRF, MFA)

---

## 📄 License

Internal project – VNU-IS, Khoa Kinh tế và Quản lý, Trường Quốc tế.  
Mùa I: **IS-NextGen Manager Challenge 2026 – "The Manager in the AI Era"**.