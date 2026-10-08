"use client";
import { FormEvent, useState } from "react";
import {
  adminApi,
  downloadAdmin,
  RegistrationItem,
  viTime,
} from "@/lib/admin/api";
import {
  Button,
  Field,
  inputClass,
  Notice,
  Panel,
  Table,
  useOperations,
  useResource,
} from "./common";

export default function Registrations() {
  const [search, setSearch] = useState(""),
    [school, setSchool] = useState(""),
    [query, setQuery] = useState("");
  const list = useResource<RegistrationItem[]>(
      `admin/registrations?${query}`,
      [],
    ),
    all = useResource<RegistrationItem[]>("admin/registrations", []);
  const [detail, setDetail] = useState<RegistrationItem | null>(null),
    [credentials, setCredentials] = useState<{
      identifier: string;
      email: string;
      password: string;
    } | null>(null);
  const op = useOperations(),
    [create, setCreate] = useState(false);
  const schools = [
    ...new Set(all.data.map((r) => r.school).filter(Boolean)),
  ] as string[];
  async function account(row: RegistrationItem, action: string) {
    let reason: string | undefined;
    if (action === "DELETE") {
      reason =
        window.prompt(`Lý do xoá tài khoản ${row.fullName}:`) ?? undefined;
      if (!reason?.trim()) return;
    }
    if (
      ["DISABLE", "RESET"].includes(action) &&
      !window.confirm(
        `${action === "RESET" ? "Cấp lại mật khẩu và huỷ phiên cũ" : "Khoá tài khoản"} cho ${row.fullName}?`,
      )
    )
      return;
    await op.run(async () => {
      const result = await adminApi<{
        identifier: string;
        email: string;
        password?: string;
      }>(`admin/candidates/${row.id}/account`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      setCredentials(
        result.password ? { ...result, password: result.password } : null,
      );
      await Promise.all([list.reload(), all.reload()]);
    });
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      fields = new FormData(form);
    void op.run(async () => {
      setCredentials(
        await adminApi("admin/candidates", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(fields)),
        }),
      );
      form.reset();
      setCreate(false);
      await Promise.all([list.reload(), all.reload()]);
    });
  }
  return (
    <div className="space-y-6">
      <Notice message={list.error || all.error || op.error} error />
      <Notice message={op.message} />
      <Panel title="Hồ sơ đăng ký & tài khoản thí sinh">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(new URLSearchParams({ search, school }).toString());
          }}
        >
          <div className="flex-1 min-w-60">
            <Field label="Tìm theo MSSV, họ tên, email hoặc mã thí sinh">
              <input
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={200}
              />
            </Field>
          </div>
          <Field label="Trường">
            <select
              className={inputClass}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            >
              <option value="">Tất cả</option>
              {schools.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Button type="submit">Tìm kiếm</Button>
          <Button onClick={() => setCreate(!create)}>Cấp tài khoản mới</Button>
        </form>
        <div className="flex gap-2">
          <Button
            disabled={op.busy || list.loading}
            onClick={() =>
              void op.run(
                () =>
                  downloadAdmin(
                    `registrations/export?format=csv&${query}`,
                    "registrations.csv",
                  ),
                "Đã xuất CSV.",
              )
            }
          >
            Xuất CSV
          </Button>
          <Button
            disabled={op.busy || list.loading}
            onClick={() =>
              void op.run(
                () =>
                  downloadAdmin(
                    `registrations/export?format=xlsx&${query}`,
                    "registrations.xlsx",
                  ),
                "Đã xuất Excel.",
              )
            }
          >
            Xuất Excel
          </Button>
        </div>
        {list.loading && (
          <p role="status" className="text-sm text-slate-500">
            Đang tải hồ sơ…
          </p>
        )}
        <Table
          headers={[
            "Mã thí sinh / MSSV",
            "Họ tên / Email",
            "Trường",
            "Hồ sơ",
            "Tài khoản",
            "Thao tác",
          ]}
          rows={list.data.map((r) => [
            <div key={r.id}>
              {r.candidateCode || "Chưa cấp mã"}
              <div className="text-slate-500">{r.studentId}</div>
            </div>,
            <div key={r.id}>
              {r.fullName}
              <div className="text-slate-500">{r.email}</div>
            </div>,
            r.school,
            r.state === "SUBMITTED"
              ? "Đã nộp"
              : r.state === "DRAFT"
                ? "Bản nháp"
                : "Chưa đăng ký",
            r.deleted
              ? "Đã xoá"
              : r.accountStatus === "ACTIVE"
                ? "Hoạt động"
                : r.accountStatus === "DISABLED"
                  ? "Đã khoá"
                  : "Chưa kích hoạt",
            <div key={r.id} className="flex flex-wrap gap-2 min-w-60">
              <Button onClick={() => setDetail(r)}>Chi tiết</Button>
              {!r.deleted && (
                <>
                  {!r.userId ? (
                    <Button
                      disabled={op.busy}
                      onClick={() => void account(r, "PROVISION")}
                    >
                      Cấp tài khoản
                    </Button>
                  ) : (
                    <>
                      <Button
                        disabled={op.busy}
                        onClick={() =>
                          void account(
                            r,
                            r.accountStatus === "ACTIVE" ? "DISABLE" : "ENABLE",
                          )
                        }
                      >
                        {r.accountStatus === "ACTIVE" ? "Khoá" : "Mở khoá"}
                      </Button>
                      <Button
                        disabled={op.busy}
                        onClick={() => void account(r, "RESET")}
                      >
                        Cấp lại
                      </Button>
                      <Button
                        danger
                        disabled={op.busy}
                        onClick={() => void account(r, "DELETE")}
                      >
                        Xoá
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>,
          ])}
        />
      </Panel>
      {create && (
        <Panel title="Cấp tài khoản thí sinh">
          <form onSubmit={add} className="grid sm:grid-cols-2 gap-4">
            {[
              ["fullName", "Họ tên"],
              ["email", "Email"],
              ["studentId", "MSSV"],
              ["school", "Trường"],
            ].map(([name, label]) => (
              <Field label={label} key={name}>
                <input
                  required
                  type={name === "email" ? "email" : "text"}
                  className={inputClass}
                  name={name}
                  maxLength={name === "email" ? 255 : 200}
                />
              </Field>
            ))}
            <Button type="submit" disabled={op.busy}>
              Cấp tài khoản
            </Button>
          </form>
        </Panel>
      )}
      {credentials && (
        <Panel title="Thông tin đăng nhập vừa cấp">
          <p className="text-sm text-slate-500">
            Lưu thông tin để chuyển cho thí sinh. Mật khẩu chỉ xuất hiện trong
            lần cấp này.
          </p>
          <p>
            Tài khoản: <strong>{credentials.identifier}</strong>
          </p>
          <p>Email: {credentials.email}</p>
          <p className="break-all font-mono">
            Mật khẩu: {credentials.password}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                void op.run(
                  () =>
                    navigator.clipboard.writeText(
                      `Tài khoản: ${credentials.identifier}\nEmail: ${credentials.email}\nMật khẩu: ${credentials.password}`,
                    ),
                  "Đã sao chép.",
                )
              }
            >
              Sao chép
            </Button>
            <Button onClick={() => setCredentials(null)}>Ẩn thông tin</Button>
          </div>
        </Panel>
      )}
      {detail && (
        <Panel title={`Hồ sơ · ${detail.fullName}`}>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              ["Mã thí sinh", detail.candidateCode],
              ["MSSV", detail.studentId],
              ["Ngày sinh", detail.dateOfBirth?.slice(0, 10)],
              ["Trường", detail.school],
              ["Khoa/viện", detail.department],
              ["Ngành", detail.major],
              ["Email", detail.email],
              ["Điện thoại", detail.phone],
              ["Facebook", detail.facebook],
              ["Nộp lúc", viTime(detail.submittedAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium break-all">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          {detail.videoId && detail.registrationId ? (
            <video
              key={detail.videoId}
              controls
              preload="metadata"
              className="w-full max-h-96 rounded-lg bg-black"
              src={`/api/v1/admin/registrations/${detail.registrationId}/video`}
            />
          ) : (
            <p className="text-sm text-slate-500">Chưa có video đã nộp.</p>
          )}
          <Button onClick={() => setDetail(null)}>Đóng</Button>
        </Panel>
      )}
    </div>
  );
}
