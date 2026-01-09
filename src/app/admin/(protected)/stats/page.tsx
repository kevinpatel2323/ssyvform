"use client";

import { StatsDashboard } from "@/components/admin/StatsDashboard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

async function getStatsData(gender: string) {
  try {
    const params = new URLSearchParams();
    if (gender && gender !== "all") params.set("gender", gender);
    const url = `/api/admin/stats${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats data');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

export default function StatsPage() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    getStatsData(gender).then(data => {
      setStatsData(data);
      setLoading(false);
    });
  }, [gender]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <BackButton />
              <h1 className="text-xl font-bold">Stats Dashboard</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <h1 className="text-xl font-bold">Stats Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue placeholder="All genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <StatsDashboard statsData={statsData} />
      </div>
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  
  return (
    <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
