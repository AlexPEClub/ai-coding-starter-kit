"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConfig, saveConfig } from "@/lib/storage";

export default function CompanyAdminPage() {
  const config = useConfig();
  const c = config.company;

  const update = (patch: Partial<typeof c>) =>
    saveConfig({ ...config, company: { ...c, ...patch } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Firmendaten</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Werden im Angebots-PDF verwendet.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Firmenname</Label>
            <Input value={c.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Adresse</Label>
            <Textarea
              rows={3}
              value={c.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail</Label>
            <Input
              type="email"
              value={c.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={c.phone} onChange={(e) => update({ phone: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>USt-IdNr.</Label>
            <Input value={c.vatId} onChange={(e) => update({ vatId: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
