import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LegalDocNorm } from '@/hooks/useDocumentSync';
import { ScrollText, FileText, Newspaper, AlertTriangle } from 'lucide-react';

interface DocumentStatsProps {
  docs: LegalDocNorm[];
  className?: string;
}

export function DocumentStats({ docs, className }: DocumentStatsProps) {
  const statsByType = docs.reduce((acc, doc) => {
    const type = doc.type;
    if (!acc[type]) {
      acc[type] = { count: 0, latest: null as string | null };
    }
    acc[type].count++;
    
    // Track latest date for each type
    if (!acc[type].latest || new Date(doc.date) > new Date(acc[type].latest)) {
      acc[type].latest = doc.date;
    }
    
    return acc;
  }, {} as Record<string, { count: number; latest: string | null }>);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'act':
        return ScrollText;
      case 'bill':
        return FileText;
      case 'gazette':
        return Newspaper;
      case 'extraordinary gazette':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRecentCount = (type: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return docs.filter(doc => 
      doc.type === type && 
      new Date(doc.date) >= oneWeekAgo
    ).length;
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statsByType)
          .sort(([,a], [,b]) => b.count - a.count)
          .map(([type, stats]) => {
            const Icon = getTypeIcon(type);
            const recentCount = getRecentCount(type);
            
            return (
              <Card key={type} className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Latest: {formatDate(stats.latest)}
                  </div>
                  {recentCount > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      +{recentCount} this week
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Total Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{docs.length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground mt-1">
            Last updated: {new Date().toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}