"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, MapPin, Heart, Calendar } from "lucide-react";

interface StatsData {
  totalRegistrations: number;
  verificationStats: {
    verified: number;
    unverified: number;
  };
  genderDistribution: Record<string, number>;
  citiesByRegistrations: Record<string, number>;
  maritalStatusDistribution: Record<string, number>;
  nativePlaceDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
}

interface StatsDashboardProps {
  statsData: StatsData | null;
}

export function StatsDashboard({ statsData }: StatsDashboardProps) {
  if (!statsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load statistics</p>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const SimpleBarChart = ({ 
    data, 
    title, 
    maxHeight = 200 
  }: { 
    data: Record<string, number>; 
    title: string;
    maxHeight?: number;
  }) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const maxValue = entries.length > 0 ? Math.max(...entries.map(([, value]) => value)) : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.map(([key, value]) => {
              return (
                <div key={key} className="flex items-center space-x-2">
                  <div className="w-24 text-sm truncate" title={key}>
                    {key}
                  </div>
                  <div className="flex-1 relative">
                    <div 
                      className="bg-blue-500 rounded-sm transition-all duration-300 hover:bg-blue-600"
                      style={{ height: '20px', width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-right font-medium">
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const DataTable = ({ 
    data, 
    title, 
    columns 
  }: { 
    data: Record<string, number>; 
    title: string;
    columns: { key: string; label: string }[];
  }) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map((column, index) => (
                    // first left, all others right
                    <th key={column.key} className={index === 0 ? "text-left py-2 px-2" : "text-right py-2 px-2"}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(([key, value]) => (
                  <tr key={key} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 px-2 capitalize">{key}</td>
                    <td className="py-2 px-2 text-right font-medium">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registrations"
          value={statsData.totalRegistrations.toLocaleString()}
          icon={Users}
          description="All registered users"
        />
        <StatCard
          title="Verified Users"
          value={statsData.verificationStats.verified.toLocaleString()}
          icon={UserCheck}
          description="Successfully verified"
        />
        <StatCard
          title="Unverified Users"
          value={statsData.verificationStats.unverified.toLocaleString()}
          icon={UserX}
          description="Pending verification"
        />
        <StatCard
          title="Verification Rate"
          value={`${statsData.totalRegistrations > 0 
            ? Math.round((statsData.verificationStats.verified / statsData.totalRegistrations) * 100) 
            : 0}%`}
          icon={Users}
          description="% of verified users"
        />
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gender Distribution */}
        <SimpleBarChart
          data={statsData.genderDistribution}
          title="Gender Distribution"
        />

        {/* Age Distribution */}
        <SimpleBarChart
          data={statsData.ageDistribution}
          title="Age Distribution"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Cities by Registrations - Table */}
        <DataTable
          data={statsData.citiesByRegistrations}
          title="Cities by Registrations"
          columns={[
            { key: 'city', label: 'City' },
            { key: 'count', label: 'Registrations' }
          ]}
        />

        {/* Native Place Distribution - Table */}
        <DataTable
          data={statsData.nativePlaceDistribution}
          title="Native Place Distribution"
          columns={[
            { key: 'place', label: 'Native Place' },
            { key: 'count', label: 'Count' }
          ]}
        />

        {/* Marital Status Distribution - Table */}
        <DataTable
          data={statsData.maritalStatusDistribution}
          title="Marital Status Distribution"
          columns={[
            { key: 'status', label: 'Status' },
            { key: 'count', label: 'Count' }
          ]}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top City</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(statsData.citiesByRegistrations).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(statsData.citiesByRegistrations).sort(([, a], [, b]) => b - a)[0]?.[1] || 0} registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Common Age Group</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(statsData.ageDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(statsData.ageDistribution).sort(([, a], [, b]) => b - a)[0]?.[1] || 0} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Common Status</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(statsData.maritalStatusDistribution).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(statsData.maritalStatusDistribution).sort(([, a], [, b]) => b - a)[0]?.[1] || 0} users
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
