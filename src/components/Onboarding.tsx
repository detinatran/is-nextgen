"use client";

import "driver.js/dist/driver.css";
import type { Config, DriveStep, Driver } from "driver.js";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Lang, localePath } from "@/lib/i18n";

/**
 * Hướng dẫn dự thi dạng spotlight (Driver.js) cho trang chủ.
 * - Lần đầu vào trang chủ: hỏi có muốn xem hướng dẫn không (lưu lựa chọn trong localStorage).
 * - Nút "Hướng dẫn dự thi" cố định góc trái và link có [data-tour-start] mở lại hướng dẫn từ bất kỳ trang nào.
 * Chỉ đọc giao diện, không đụng tới form đăng ký hay đăng nhập.
 */

const STORAGE_KEY = "nextgen-tour";
const PENDING_KEY = "nextgen-tour-pending";

const copy = {
  vi: {
    welcomeTitle: "Chào mừng bạn đến với NextGen!",
    welcomeBody: "Dành 1 phút để xem nhanh những phần quan trọng của trang: cuộc thi là gì, các vòng thi, mốc thời gian và cách đăng ký.",
    start: "Bắt đầu khám phá",
    later: "Để sau",
    help: "Hướng dẫn dự thi",
    next: "Tiếp",
    prev: "Quay lại",
    done: "Hoàn tất",
    skip: "Bỏ qua",
    close: "Đóng hướng dẫn",
    steps: {
      hero: ["Trang chủ NextGen Manager 2026", "Cuộc thi quản trị thực chiến dành cho sinh viên toàn quốc, do Khoa Kinh tế và Quản lý, Trường Quốc tế - ĐHQGHN tổ chức. Mọi thông tin chính thức của mùa giải đều được cập nhật tại đây."],
      nav: ["Thanh điều hướng", "Chuyển nhanh tới từng phần của trang. Mục Thể lệ có đầy đủ quy định của bốn vòng thi, cách chấm điểm và lịch chi tiết."],
      navMobile: ["Menu", "Bấm vào đây để mở menu và chuyển nhanh tới từng phần. Mục Thể lệ có đầy đủ quy định của bốn vòng thi, cách chấm điểm và lịch chi tiết."],
      register: ["Đăng ký tham gia", "Đồng hồ đếm ngược tới hạn nộp hồ sơ. Bấm Đăng ký ngay để điền thông tin, tải ảnh và video giới thiệu. Sau khi nộp, bạn nhận email xác nhận; trước ngày thi Vòng Đơn, Ban Tổ chức gửi tiếp tài khoản thi qua email."],
      about: ["Thông tin cuộc thi", "Mục tiêu của cuộc thi, hành trình bốn vòng từ kiểm tra năng lực đến giải bài toán của doanh nghiệp, và những gì bạn nhận được khi tham gia."],
      milestones: ["Các vòng thi và mốc thời gian", "Bốn chặng chính cùng thời gian dự kiến. Chặng đang diễn ra được làm nổi bật để bạn biết mình đang ở đâu trong lộ trình."],
      contact: ["Hỏi đáp và liên hệ", "Câu trả lời cho các thắc mắc thường gặp nằm ngay bên cạnh. Cần hỗ trợ thêm, bạn gọi hotline hoặc gửi email cho Ban Tổ chức."],
      help: ["Xem lại bất cứ lúc nào", "Nút này mở lại phần hướng dẫn khi bạn cần. Chúc bạn một mùa thi thật nhiều trải nghiệm!"],
    },
  },
  en: {
    welcomeTitle: "Welcome to NextGen!",
    welcomeBody: "Take a minute for a quick look at the key parts of the site: what the competition is, the rounds, key dates and how to register.",
    start: "Start the tour",
    later: "Maybe later",
    help: "How to take part",
    next: "Next",
    prev: "Back",
    done: "Finish",
    skip: "Skip",
    close: "Close the tour",
    steps: {
      hero: ["NextGen Manager 2026", "A hands-on management competition for students nationwide, organized by the Faculty of Economics and Management, VNU International School. All official season updates are published here."],
      nav: ["Navigation", "Jump to any part of the page. Rules has the full details of the four rounds, scoring and the schedule."],
      navMobile: ["Menu", "Tap here to open the menu and jump to any part of the page. Rules has the full details of the four rounds, scoring and the schedule."],
      register: ["Register", "The countdown shows the application deadline. Press Register now to fill in your details and upload a photo and intro video. You will get a confirmation email, then your exam account by email before the Application Round."],
      about: ["About the competition", "What the competition aims for, the four-round journey from an aptitude test to a real company case, and what you gain by taking part."],
      milestones: ["Rounds and key dates", "The four main stages and their planned dates. The current stage is highlighted so you always know where you are."],
      contact: ["Q&A and contact", "Answers to common questions are right here. For anything else, call the hotline or email the Organizing Committee."],
      help: ["Replay any time", "This button opens the tour again whenever you need it. Enjoy the season!"],
    },
  },
};

const read = (key: string, store: "local" | "session" = "local") => {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null, store: "local" | "session" = "local") => {
  try {
    const s = store === "local" ? localStorage : sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    // Trình duyệt chặn bộ nhớ: bỏ qua, hướng dẫn vẫn chạy được
  }
};

/** Phần tử đang hiển thị đầu tiên khớp selector (menu ngang trên máy tính, nút menu trên điện thoại). */
const visible = (selector: string) => () =>
  ([...document.querySelectorAll(selector)].find((el) => el.getClientRects().length > 0) ?? document.querySelector(selector)) as Element;

/** Hiện ngay các khối đang chờ hiệu ứng xuất hiện khi cuộn, để khung sáng đo đúng vị trí. */
function revealAround(el: Element | undefined) {
  if (!el) return;
  el.closest(".reveal")?.classList.add("is-visible");
  if (el.classList.contains("reveal")) el.classList.add("is-visible");
  el.querySelectorAll(".reveal").forEach((r) => r.classList.add("is-visible"));
}

export default function Onboarding({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const pathname = usePathname();
  const router = useRouter();
  const home = localePath(lang, "/");
  const onHome = pathname === home || pathname === home.replace(/\/$/, "");
  const [welcome, setWelcome] = useState(false);
  const driverRef = useRef<Driver | null>(null);
  const helpRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  const startTour = useCallback(async () => {
    setWelcome(false);
    driverRef.current?.destroy();
    const { driver } = await import("driver.js");
    const mobile = window.matchMedia("(max-width: 1279px)").matches;
    const step = (key: keyof typeof t.steps, element: DriveStep["element"]): DriveStep => ({
      element,
      popover: { title: t.steps[key][0], description: t.steps[key][1] },
    });
    const steps: DriveStep[] = [
      step("hero", '[data-tour="hero"]'),
      step(mobile ? "navMobile" : "nav", visible('[data-tour="nav"]')),
      step("register", '[data-tour="register"]'),
      step("about", '[data-tour="about"]'),
      step("milestones", '[data-tour="milestones"]'),
      step("contact", '[data-tour="contact"]'),
      step("help", '[data-tour="help"]'),
    ];
    const config: Config = {
      steps,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: true,
      skipMissingElement: true,
      overlayColor: "#071533",
      overlayOpacity: 0.62,
      stagePadding: 8,
      stageRadius: 18,
      popoverOffset: 14,
      popoverClass: "ng-tour",
      showProgress: true,
      progressText: "{{current}}/{{total}}",
      nextBtnText: t.next,
      prevBtnText: t.prev,
      doneBtnText: t.done,
      closeBtnLabel: t.close,
      onHighlightStarted: (el) => revealAround(el),
      // Sau hiệu ứng xuất hiện (0,7 giây) đo lại vị trí khung sáng
      onHighlighted: () => window.setTimeout(() => driverRef.current?.refresh(), 750),
      onPopoverRender: (popover, { driver: d }) => {
        popover.wrapper.setAttribute("role", "dialog");
        popover.wrapper.setAttribute("aria-modal", "false");
        popover.wrapper.setAttribute("aria-labelledby", "driver-popover-title");
        popover.wrapper.setAttribute("aria-describedby", "driver-popover-description");
        if (!d.isLastStep()) {
          const skip = document.createElement("button");
          skip.type = "button";
          skip.className = "ng-tour-skip";
          skip.textContent = t.skip;
          skip.addEventListener("click", () => d.destroy());
          popover.footer.prepend(skip);
        }
        window.setTimeout(() => popover.nextButton.focus({ preventScroll: true }), 50);
      },
      onDestroyed: () => {
        write(STORAGE_KEY, "done");
        driverRef.current = null;
        helpRef.current?.focus({ preventScroll: true });
      },
    };
    const d = driver(config);
    driverRef.current = d;
    d.drive();
  }, [t]);

  // Mở hướng dẫn: ở trang chủ thì chạy luôn, trang khác thì về trang chủ rồi chạy
  const requestTour = useCallback(() => {
    if (onHome) startTour();
    else {
      write(PENDING_KEY, "1", "session");
      router.push(home);
    }
  }, [home, onHome, router, startTour]);

  useEffect(() => {
    if (!onHome) return;
    const params = new URLSearchParams(window.location.search);
    const pending = read(PENDING_KEY, "session") === "1" || params.get("tour") === "1";
    if (pending) {
      // Chỉ xoá cờ khi thực sự bắt đầu, để effect chạy lại (Strict Mode, render lại) không làm mất yêu cầu
      const id = window.setTimeout(() => {
        write(PENDING_KEY, null, "session");
        if (params.has("tour")) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
        startTour();
      }, 600);
      return () => window.clearTimeout(id);
    }
    // Lần đầu vào trang chủ (chưa xem, chưa từ chối) và không mở bằng link tới một mục cụ thể
    if (!read(STORAGE_KEY) && !window.location.hash) {
      const id = window.setTimeout(() => setWelcome(true), 1200);
      return () => window.clearTimeout(id);
    }
  }, [onHome, startTour]);

  // Link có [data-tour-start] (ví dụ ở footer) mở hướng dẫn thay vì chuyển trang
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("[data-tour-start]");
      if (!link) return;
      e.preventDefault();
      requestTour();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [requestTour]);

  useEffect(() => () => driverRef.current?.destroy(), []);

  useEffect(() => {
    if (!welcome) return;
    startRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [welcome]);

  function dismiss() {
    write(STORAGE_KEY, "dismissed");
    setWelcome(false);
  }

  return (
    <>
      <button
        ref={helpRef}
        type="button"
        data-tour="help"
        onClick={requestTour}
        aria-label={t.help}
        className="group fixed bottom-5 left-5 z-40 flex h-11 items-center gap-2 rounded-full bg-white pr-2 pl-2 text-sm font-semibold text-navy shadow-lg shadow-navy/15 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-xl sm:pr-4"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </span>
        <span className="hidden sm:inline">{t.help}</span>
      </button>

      {welcome && (
        <div className="fixed inset-0 z-[10001] flex items-end justify-center bg-navy-deep/60 p-4 backdrop-blur-[2px] sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && dismiss()}>
          <div role="dialog" aria-modal="true" aria-labelledby="ng-welcome-title" aria-describedby="ng-welcome-body" className="ng-welcome w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
            <p className="text-[13px] font-bold tracking-[0.16em] text-orange uppercase">NextGen Manager 2026</p>
            <h2 id="ng-welcome-title" className="mt-2 text-2xl leading-tight font-bold text-navy">
              {t.welcomeTitle}
            </h2>
            <p id="ng-welcome-body" className="mt-3 text-[15px] leading-relaxed text-muted">
              {t.welcomeBody}
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={dismiss} className="btn-outline px-5 py-2.5 text-sm">
                {t.later}
              </button>
              <button ref={startRef} type="button" onClick={startTour} className="btn-primary px-6 py-2.5 text-sm">
                {t.start}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
