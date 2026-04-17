"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PensionModeller } from "./PensionModeller";
import { InvestmentProjections } from "./InvestmentProjections";
import { RetirementPlanner } from "./RetirementPlanner";
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
    <Tabs defaultValue="retirement" className="space-y-6">
      <TabsList className="h-10 bg-muted/50 border border-border p-1">
        <TabsTrigger value="retirement" className="text-sm">
          Retirement & SWR
        </TabsTrigger>
        <TabsTrigger value="investments" className="text-sm">
          Investment growth
        </TabsTrigger>
        <TabsTrigger value="pension" className="text-sm">
          Pension modeller
        </TabsTrigger>
      </TabsList>

      <TabsContent value="retirement" className="mt-0">
        <RetirementPlanner
          currentIsaPence={data.currentIsaPence}
          currentInvestmentPence={data.currentInvestmentPence}
          currentPensionPence={data.currentPensionPence}
        />
      </TabsContent>

      <TabsContent value="investments" className="mt-0">
        <InvestmentProjections
          currentIsaPence={data.currentIsaPence}
          currentInvestmentPence={data.currentInvestmentPence}
          currentPensionPence={data.currentPensionPence}
        />
      </TabsContent>

      <TabsContent value="pension" className="mt-0">
        <PensionModeller
          currentPensionPence={data.currentPensionPence}
          latestMonth={data.latestMonth}
          scenarios={data.scenarios}
          pensionAccountId={data.pensionAccountId}
        />
      </TabsContent>
    </Tabs>
  );
}
