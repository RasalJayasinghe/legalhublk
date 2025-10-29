import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PartnerStats {
  totalDocuments: number;
  totalViews: number;
  totalRevenue: number;
  publishedDocuments: number;
}

export function PartnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      try {
        // Get partner profile
        const { data: profile } = await supabase
          .from("partner_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          // Get document count by status
          const { count: publishedCount } = await supabase
            .from("partner_documents")
            .select("*", { count: "exact", head: true })
            .eq("partner_id", profile.id)
            .eq("status", "published");

          setStats({
            totalDocuments: profile.total_documents || 0,
            totalViews: profile.total_views || 0,
            totalRevenue: Number(profile.total_revenue) || 0,
            publishedDocuments: publishedCount || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Documents",
      value: stats?.totalDocuments || 0,
      description: `${stats?.publishedDocuments || 0} published`,
      icon: FileText,
    },
    {
      title: "Total Views",
      value: stats?.totalViews || 0,
      description: "All-time document views",
      icon: Eye,
    },
    {
      title: "Total Revenue",
      value: `LKR ${(stats?.totalRevenue || 0).toLocaleString()}`,
      description: "Lifetime earnings",
      icon: DollarSign,
    },
    {
      title: "Growth",
      value: "+0%",
      description: "Since last month",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Partner Dashboard</CardTitle>
          <CardDescription>
            Upload legal documents, track analytics, and manage your content portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-semibold mb-2">Getting Started</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Upload your first document using the Upload tab</li>
              <li>• Documents are reviewed by admins before going live</li>
              <li>• Track views and revenue in real-time</li>
              <li>• Manage all your documents in the Documents tab</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
