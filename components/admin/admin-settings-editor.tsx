"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateSettings } from "@/features/admin/actions";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import {
  SETTING_GROUPS,
  type SettingFieldDef,
} from "@/features/admin/settings-definitions";

interface Props {
  values: Record<string, string>;
}

function linesToDisplay(value: string): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join("\n");
  } catch {
    // plain lines
  }
  return value;
}

function displayToLines(value: string): string {
  const lines = value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(lines);
}

/** Keeps the typed text (blank lines included) while editing; the stored value is the cleaned list. */
function LinesField({
  field,
  value,
  onChange,
}: {
  field: SettingFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(() => linesToDisplay(value));
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
      <Textarea
        id={field.key}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(displayToLines(e.target.value));
        }}
        rows={5}
        placeholder="One item per line"
      />
    </div>
  );
}

function imageKindForField(key: string): "logo" | "footer" {
  return key === "branding_footer_image_url" ? "footer" : "logo";
}

function SettingField({
  field,
  value,
  onChange,
}: {
  field: SettingFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  if (field.type === "image") {
    const kind = imageKindForField(field.key);

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("kind", kind);
        const res = await fetch("/api/admin/files/upload-branding", {
          method: "POST",
          body,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "The upload failed. Please try again.");
        onChange(data.fileUrl);
        toast.success("Image uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    }

    return (
      <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
        <div>
          <Label htmlFor={field.key}>{field.label}</Label>
          {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
        </div>
        {value ? (
          <div className="relative h-28 w-28 overflow-hidden rounded-xl border bg-white">
            <Image
              src={value}
              alt={field.label}
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No image uploaded yet.</p>
        )}
        <div>
          <label
            htmlFor={field.key}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-kiosk-navy px-4 py-2 text-sm font-medium text-white hover:bg-kiosk-navy/90"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
          </label>
          <input
            id={field.key}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleImageChange}
            disabled={uploading}
          />
        </div>
        {value ? (
          <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
        ) : null}
      </div>
    );
  }

  if (field.type === "video") {
    async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/files/upload-promo-video", {
          method: "POST",
          body,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "The upload failed. The video may be too large.");
        onChange(data.fileUrl);
        toast.success("Video uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    }

    return (
      <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
        <div>
          <Label htmlFor={field.key}>{field.label}</Label>
          {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
        </div>
        {value ? (
          <video
            src={value}
            className="max-h-48 w-full rounded-xl border bg-black object-contain"
            controls
            preload="metadata"
          />
        ) : (
          <p className="text-sm text-gray-500">No promotional video uploaded yet.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={field.key}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-kiosk-navy px-4 py-2 text-sm font-medium text-white hover:bg-kiosk-navy/90"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : value ? "Replace video" : "Upload video"}
          </label>
          {value ? (
            <Button type="button" variant="outline" onClick={() => onChange("")}>
              Remove
            </Button>
          ) : null}
          <input
            id={field.key}
            type="file"
            className="hidden"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
            onChange={handleVideoChange}
            disabled={uploading}
          />
        </div>
        {value ? (
          <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
        ) : null}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
        <div>
          <Label htmlFor={field.key}>{field.label}</Label>
          {field.description && (
            <p className="text-xs text-gray-500">{field.description}</p>
          )}
        </div>
        <Switch
          id={field.key}
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
        />
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "json") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
        <Textarea
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "json" ? 8 : 3}
          placeholder={field.placeholder}
          className={field.type === "json" ? "font-mono text-xs" : undefined}
        />
      </div>
    );
  }

  if (field.type === "lines") {
    return <LinesField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "number") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
        <Input
          id={field.key}
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  if (field.type === "password") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
        <Input
          id={field.key}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "••••••••"}
          autoComplete="new-password"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      <Input
        id={field.key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}

/** First problem that would stop a setting from working, with the tab it is on. */
function findSettingProblem(values: Record<string, string>): { group: string; message: string } | null {
  for (const group of SETTING_GROUPS) {
    for (const field of group.fields) {
      const value = (values[field.key] ?? "").trim();
      if (!value) continue;
      if (field.type === "number" && (!/^\d+$/.test(value) || Number(value) < 1)) {
        return { group: group.id, message: `${field.label} must be a whole number of 1 or more.` };
      }
      if (field.type === "json") {
        try {
          JSON.parse(value);
        } catch {
          return { group: group.id, message: `${field.label} is not valid JSON. Check the brackets and quotes.` };
        }
      }
    }
  }
  return null;
}

export function AdminSettingsEditor({ values: initialValues }: Props) {
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [tab, setTab] = useState<string>(SETTING_GROUPS[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const dirty = Object.keys(values).some((key) => values[key] !== savedValues[key]);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const problem = findSettingProblem(values);
    if (problem) {
      setTab(problem.group);
      toast.error(problem.message);
      return;
    }
    startTransition(async () => {
      const result = await updateSettings(values);
      if (result.success) {
        setSavedValues(values);
        toast.success("Settings saved. The kiosk picks them up on its next refresh.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Settings"
        description="Kiosk branding, contact details, downloads and email, storage, the idle screen and the building directory."
        actions={
          <>
            {dirty ? <span className="text-xs font-medium text-amber-700">Unsaved changes</span> : null}
            <Button onClick={handleSave} disabled={isPending || !dirty}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(next) => setTab(String(next))}>
        <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
          {SETTING_GROUPS.map((group) => (
            <TabsTrigger key={group.id} value={group.id}>
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTING_GROUPS.map((group) => (
          <TabsContent key={group.id} value={group.id}>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              {group.description && (
                <p className="mb-4 text-sm text-gray-500">{group.description}</p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((field) => (
                  <div
                    key={field.key}
                    className={
                      field.type === "textarea" ||
                      field.type === "json" ||
                      field.type === "lines" ||
                      field.type === "image" ||
                      field.type === "video"
                        ? "md:col-span-2"
                        : undefined
                    }
                  >
                    <SettingField
                      field={field}
                      value={values[field.key] ?? ""}
                      onChange={(v) => {
                        setField(field.key, v);
                        if (field.key === "promo_video_url" && v.trim()) {
                          setField("promo_video_enabled", "true");
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </AdminPage>
  );
}
