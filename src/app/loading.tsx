import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div>
        <Skeleton className="h-4 w-40 bg-muted" />
        <Skeleton className="h-12 w-64 mt-2 bg-muted" />
        <Skeleton className="h-4 w-48 mt-2 bg-muted" />
      </div>

      {/* 3 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-xl border-border/30">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2 bg-muted" />
              <Skeleton className="h-7 w-32 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl border-border/30 p-6">
          <Skeleton className="h-[300px] bg-muted rounded-lg" />
        </Card>
        <Card className="rounded-xl border-border/30 p-6">
          <Skeleton className="h-[300px] bg-muted rounded-lg" />
        </Card>
      </div>

      {/* MoM chart */}
      <Card className="rounded-xl border-border/30 p-6">
        <Skeleton className="h-[250px] bg-muted rounded-lg" />
      </Card>

      {/* Table */}
      <Card className="rounded-xl border-border/30 p-6">
        <Skeleton className="h-[200px] bg-muted rounded-lg" />
      </Card>
    </div>
  );
}
