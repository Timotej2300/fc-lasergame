"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminPravidlaPage() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/rules")
      .then((r) => r.json())
      .then((d) => setContent(d.content ?? ""));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Pravidlá</h1>
      <Card>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full rounded-xl bg-panel2 border border-white/10 px-4 py-3 font-mono text-sm"
        />
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={save} disabled={saving}>{saving ? "Ukladám..." : "Uložiť pravidlá"}</Button>
          {saved && <span className="text-ok text-sm">Uložené ✓</span>}
        </div>
      </Card>
    </div>
  );
}
