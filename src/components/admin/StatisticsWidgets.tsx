"use client";

import { useEffect, useState } from "react";
import { Users, MapPin, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INITIAL_GUJARAT_CITIES = [
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Bhavnagar",
  "Jamnagar",
  "Junagadh",
  "Gandhidham",
  "Nadiad",
  "Gandhinagar",
  "Anand",
  "Morbi",
  "Mehsana",
  "Surendranagar",
  "Bharuch",
  "Vapi",
  "Navsari",
  "Veraval",
  "Porbandar",
  "Godhra",
  "Palanpur",
  "Valsad",
  "Bhuj",
  "Gondal",
  "Amreli",
  "Botad",
  "Deesa",
  "Patan",
  "Himmatnagar",
  "Dahod",
  "Modasa",
  "Jetpur",
  "Kalol",
  "Visnagar",
  "Keshod",
  "Mandvi",
  "Bardoli",
  "Chhota Udepur",
  "Vyara",
];

interface StatisticsData {
  totalEntries: number;
  cityCount: number | null;
  cityCounts: Record<string, number>;
}

interface StatisticsWidgetsProps {
  refreshTrigger?: number;
}

export function StatisticsWidgets({ refreshTrigger }: StatisticsWidgetsProps) {
  const [selectedCity, setSelectedCity] = useState<string>("Ahmedabad");
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalEntries: 0,
    cityCount: null,
    cityCounts: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availableCities, setAvailableCities] = useState<string[]>(INITIAL_GUJARAT_CITIES);

  const fetchStatistics = async (city?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) {
        params.append("city", city);
      }

      const res = await fetch(`/api/admin/statistics?${params.toString()}`);
      const json = (await res.json().catch(() => null)) as
        | StatisticsData
        | { error: string }
        | null;

      if (!res.ok || !json || "error" in json) {
        console.error("Failed to fetch statistics:", json);
        // Set default values so component still renders
        setStatistics({
          totalEntries: 0,
          cityCount: 0,
          cityCounts: {},
        });
        setIsLoading(false);
        return;
      }

      setStatistics(json);

      // Update available cities list with cities that have entries
      const citiesWithEntries = Object.keys(json.cityCounts || {}).sort();
      if (citiesWithEntries.length > 0) {
        setAvailableCities((prev) => {
          const combined = new Set([...prev, ...citiesWithEntries]);
          return Array.from(combined).sort();
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics({
        totalEntries: 0,
        cityCount: 0,
        cityCounts: {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(selectedCity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, refreshTrigger]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Entries Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <div className="text-2xl font-bold">{statistics.totalEntries}</div>
          )}
          <CardDescription className="mt-1">
            Total number of registrations
          </CardDescription>
        </CardContent>
      </Card>

      {/* City Statistics Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">City Statistics</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select City
              </label>
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statistics.cityCount ?? 0}
                </div>
                <CardDescription>
                  Entries from {selectedCity}
                </CardDescription>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
