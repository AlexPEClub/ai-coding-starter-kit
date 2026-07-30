"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers } from "lucide-react";
import { KategorienTab } from "./kategorien-tab";
import { ParameterTab } from "./parameter-tab";
import { PfadeTab } from "./pfade-tab";
import { DienstleisterTab } from "./dienstleister-tab";
import type {
  Oberkategorie,
  GeometrieParameter,
  Pfad,
  Dienstleister,
} from "@/lib/actions/werkzeugkategorien";

type WerkzeugkategorienAdminPageProps = {
  initialOberkategorien: Oberkategorie[];
  initialParameter: GeometrieParameter[];
  initialPfade: Pfad[];
  initialDienstleister: Dienstleister[];
};

export function WerkzeugkategorienAdminPage({
  initialOberkategorien,
  initialParameter,
  initialPfade,
  initialDienstleister,
}: WerkzeugkategorienAdminPageProps) {
  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6" style={{ color: "#7C6CFF" }} />
            <CardTitle>Werkzeugkategorien & Pfade</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kategorien">
            <TabsList className="mb-4">
              <TabsTrigger value="kategorien">Kategorien</TabsTrigger>
              <TabsTrigger value="parameter">Parameter-Register</TabsTrigger>
              <TabsTrigger value="pfade">Pfade</TabsTrigger>
              <TabsTrigger value="dienstleister">Dienstleister</TabsTrigger>
            </TabsList>

            <TabsContent value="kategorien">
              <KategorienTab
                initialOberkategorien={initialOberkategorien}
                initialParameter={initialParameter}
                initialPfade={initialPfade}
              />
            </TabsContent>

            <TabsContent value="parameter">
              <ParameterTab initialParameter={initialParameter} />
            </TabsContent>

            <TabsContent value="pfade">
              <PfadeTab initialPfade={initialPfade} initialDienstleister={initialDienstleister} />
            </TabsContent>

            <TabsContent value="dienstleister">
              <DienstleisterTab initialDienstleister={initialDienstleister} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
