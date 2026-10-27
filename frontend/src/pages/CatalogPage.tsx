import { useEffect, useState, type FormEvent } from "react";
import ImportExcelDialog from "../components/ImportExcelDialog";
import type { ImportMode } from "../api";

type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox" | "textarea";
  wide?: boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
};

type Props<T extends { id: string }> = {
  title: string;
  load: () => Promise<T[]>;
  save: (item: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<unknown>;
  fields: Field[];
  empty: Partial<T>;
  columns: { key: keyof T | string; label: string; format?: (row: T) => string }[];
  canWrite?: boolean;
  importMode?: ImportMode;
};

export default function CatalogPage<T extends { id: string }>({ title, load, save, remove, fields, empty, columns, canWrite = true, importMode }: Props<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [form, setForm] = useState<Partial<T>>(empty);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const refresh = async () => {
    try {
      setRows(await load());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setField = (key: string, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setError("");
    try {
      await save(form);
      setForm(empty);
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    }
  };

  return (
    <section className="biz">
      <div className="page-head page-head-row">
        <h1>{title}</h1>
        {canWrite && importMode && (
          <button type="button" className="ghost" onClick={() => setImportOpen(true)}>
            Import Excel
          </button>
        )}
      </div>
      {error && <div className="alert">{error}</div>}
      {canWrite && importMode && (
        <ImportExcelDialog
          mode={importMode}
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onDone={() => void refresh()}
        />
      )}
      <form className="card form-grid catalog-form" onSubmit={onSubmit}>
        {fields.map((field) => {
          const raw = (form as Record<string, unknown>)[field.key];
          if (field.type === "checkbox") {
            return (
              <label key={field.key} className="check-row">
                <input type="checkbox" checked={Boolean(raw)} onChange={(e) => setField(field.key, e.target.checked)} />
                {field.label}
              </label>
            );
          }
          if (field.type === "select") {
            return (
              <label key={field.key} className={field.wide ? "full" : undefined}>
                {field.label}
                <select value={String(raw ?? "")} onChange={(e) => setField(field.key, e.target.value)} required={field.required}>
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (field.type === "textarea") {
            return (
              <label key={field.key} className="full">
                {field.label}
                <textarea value={String(raw ?? "")} onChange={(e) => setField(field.key, e.target.value)} rows={3} />
              </label>
            );
          }
          return (
            <label key={field.key} className={field.wide ? "full" : undefined}>
              {field.label}
              <input
                type={field.type || "text"}
                value={String(raw ?? "")}
                onChange={(e) => setField(field.key, e.target.value)}
                required={field.required || field.key === "code" || field.key === "name"}
              />
            </label>
          );
        })}
        <div className="actions">
          {canWrite ? (
            <button type="submit">{editing ? "Cập nhật" : "Thêm mới"}</button>
          ) : (
            <p className="muted">Bạn chỉ có quyền xem danh mục này.</p>
          )}
          {editing && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setForm(empty);
                setEditing(false);
              }}
            >
              Hủy
            </button>
          )}
        </div>
      </form>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)}>{col.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={String(col.key)}>{col.format ? col.format(row) : String((row as Record<string, unknown>)[col.key as string] ?? "")}</td>
                ))}
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setForm(row);
                        setEditing(true);
                      }}
                    >
                      {canWrite ? "Sửa" : "Xem"}
                    </button>
                    {canWrite && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (confirm("Xóa dòng này?")) {
                          void remove(row.id).then(() => refresh()).catch((err) => setError(err instanceof Error ? err.message : "Không xóa được"));
                        }
                      }}
                    >
                      Xóa
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
