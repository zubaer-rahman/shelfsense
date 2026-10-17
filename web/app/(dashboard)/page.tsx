import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dispensary Dashboard"
        description="Real-time pharmaceutical ledger, reorder signals, and compliance monitoring."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/stock/movements">
                <ArrowRight className="w-4 h-4 mr-1.5" />
                Record Movement
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/products">
                <Package className="w-4 h-4 mr-1.5" />
                Manage Inventory
              </Link>
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Catalog"
          value="28 Products"
          subtitle="100% indexed"
          icon={Package}
          accentColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Reorder Signals"
          value="4 Pending"
          subtitle="Forecast recommendation"
          icon={TrendingUp}
          accentColor="bg-info/10 text-info"
        />
        <StatCard
          title="Near Expiry"
          value="3 Batches"
          subtitle="Next 30 days"
          icon={Clock}
          accentColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Critical Alerts"
          value="2 Depleted"
          subtitle="Stock below safety margin"
          icon={AlertTriangle}
          accentColor="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Quick Launchpad Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Medication Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Explore inventory levels, search by generic composition, and track SKU availability.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/products">View Catalog &rarr;</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-info" />
              Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generate supplier orders, track delivery milestones, and reconcile incoming shipments.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/purchase-orders">Manage Orders &rarr;</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              Demand Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated sales trend modeling and safety buffer calculations for zero stockouts.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/forecast">Review Forecast &rarr;</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
