"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PensionModeller } from "./PensionModeller";
import { InvestmentProjections } from "./InvestmentProjections";
import type { PensionScenario } from "@/types";

interface ProjectionsData {
  currentPensionPence: number;
  currentIsaPence: number;
  currentInvestmentPence: number;
  latestMonth: string;
  scenarios: PensionScenario[];
  pensionAccountId: string | null;
}

interface ProjectionsShellProps {
  data: ProjectionsData;
}

export function ProjectionsShell({ data }: ProjectionsShellProps) {
  return (
    <Tabs defaultValue="pension">
      <TabsList>
        <TabsTrigger value="pension">Pension Modeller</TabsTrigger>
        <TabsTrigger value="investments">Investment Projections</TabsTrigger>
      </TabsList>

      <TabsContent value="pension">
        <PensionModeller
          currentPensionPence={data.currentPensionPence}
          latestMonth={data.latestMonth}
          scenarios={data.scenarios}
          pensionAccountId={data.pensionAccountId}
        />
      </TabsContent>

      <TabsContent value="investments">
        <InvestmentProjections
          currentIsaPence={data.currentIsaPence}
          currentInvestmentPence={data.currentInvestmentPence}
          currentPensionPence={data.currentPensionPence}
        />
      </TabsContent>
    </Tabs>
  );
}
