"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  LogOut,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import Image from "next/image";
import { StatisticsWidgets } from "@/components/admin/StatisticsWidgets";

interface Registration {
  id: string;
  serial_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  name?: string; // Optional for backward compatibility
  gender: string;
  marital_status: string;
  birthday: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  relative_phone?: string;
  native_place: string;
  photo_bucket: string;
  photo_path: string;
  verified: boolean;
  created_at: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortColumn =
  | "serial_number"
  | "first_name"
  | "middle_name"
  | "last_name"
  | "gender"
  | "marital_status"
  | "birthday"
  | "city"
  | "state"
  | "zip_code"
  | "phone"
  | "native_place"
  | "verified"
  | "created_at";

type SortOrder = "asc" | "desc";

export default function AdminDashboard() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [customLimit, setCustomLimit] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const pageSizeOptions = [10, 20, 50, 100, 200, 300, 500];
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [verificationFilter, setVerificationFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortColumn>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id: string;
    url: string | null;
  } | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  const handleLimitChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      return;
    }
    
    setShowCustomInput(false);
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: parseInt(value, 10)
    }));
  };

  const handleCustomLimitSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newLimit = parseInt(customLimit, 10);
      if (!isNaN(newLimit) && newLimit > 0 && newLimit <= 1000) {
        setPagination(prev => ({
          ...prev,
          page: 1, // Reset to first page when changing limit
          limit: newLimit,
          totalPages: Math.ceil(prev.total / newLimit)
        }));
        setShowCustomInput(false);
      } else {
        toast.error("Please enter a number between 1 and 1000");
      }
    }
  };

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        gender: genderFilter,
        verified: verificationFilter === "all" ? "" : verificationFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/registrations?${params.toString()}`);
      const json = (await response.json().catch(() => null)) as
        | {
            registrations: Registration[];
            pagination: PaginationData;
          }
        | { error: string }
        | null;

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        const message = json && "error" in json ? json.error : "Failed to fetch";
        toast.error("Error", { description: message });
        return;
      }

      if (json && "registrations" in json) {
        setRegistrations(json.registrations);
        setPagination(json.pagination);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Error", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, debouncedSearch, genderFilter, verificationFilter, router]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleGenderFilterChange = (value: string) => {
    setGenderFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = useCallback(() => {
    setSearch("");
    setGenderFilter("");
    setVerificationFilter("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (e) {
      toast.error("Logout failed");
    }
  };

  const handleToggleVerification = async (id: string, currentVerified: boolean) => {
    const newVerifiedState = !currentVerified;
    
    try {
      const response = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, verified: newVerifiedState }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update verification status');
      }

      // Update the local state to reflect the change
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === id 
            ? { ...reg, verified: result.registration.verified }
            : reg
        )
      );
      
      // Show success message
      if (newVerifiedState) {
        toast.success(`User with id ${id} has been verified successfully`);
      } else {
        toast.warning(`User with id ${id} has been unverified successfully`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update verification status';
      toast.error(message);
    }
  };

  const handleViewPhoto = async (id: string) => {
    setIsPhotoLoading(true);
    setSelectedPhoto({ id, url: null });

    try {
      const res = await fetch(`/api/admin/registrations/${id}/photo`);

      const json = (await res.json().catch(() => null)) as
        | { url: string }
        | { error: string }
        | null;

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const message = json && "error" in json ? json.error : "Failed to load photo";
        toast.error("Failed to load photo", { description: message });
        setSelectedPhoto(null);
        return;
      }

      if (!json || "error" in json) {
        toast.error("Failed to load photo");
        setSelectedPhoto(null);
        return;
      }

      setSelectedPhoto({ id, url: json.url });
    } catch (e) {
      toast.error("Failed to load photo");
      setSelectedPhoto(null);
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  const renderPageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        {/* Statistics Widgets */}
        {/* <StatisticsWidgets refreshTrigger={pagination.total} /> */}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Search by id, name, phone, city, state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRegistrations}
                title="Refresh data"
                className="h-9 px-3 border-gray-300 dark:border-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Filters */}
              <div className="hidden sm:flex items-center space-x-2">
                <Select
                  value={genderFilter}
                  onValueChange={handleGenderFilterChange}
                >
                  <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={verificationFilter}
                  onValueChange={(value) => {
                    setVerificationFilter(value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified Only</SelectItem>
                    <SelectItem value="unverified">Unverified Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || genderFilter || verificationFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600 dark:text-gray-300 h-9 px-3"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="mt-3 sm:hidden flex space-x-2 overflow-x-auto pb-1">
            <Select
              value={genderFilter}
              onValueChange={handleGenderFilterChange}
            >
              <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verificationFilter}
              onValueChange={(value) => {
                setVerificationFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">
                    <div className="flex items-center justify-center space-x-2">
                      <span>Status</span>
                      <SortIcon column="verified" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("serial_number")}
                  >
                    <div className="flex items-center">
                      Serial Number
                      <SortIcon column="serial_number" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("first_name")}
                  >
                    <div className="flex items-center">
                      First Name
                      <SortIcon column="first_name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("middle_name")}
                  >
                    <div className="flex items-center">
                      Middle Name
                      <SortIcon column="middle_name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("last_name")}
                  >
                    <div className="flex items-center">
                      Last Name
                      <SortIcon column="last_name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("birthday")}
                  >
                    <div className="flex items-center">
                      Birthday
                      <SortIcon column="birthday" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("city")}
                  >
                    <div className="flex items-center">
                      City
                      <SortIcon column="city" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("state")}
                  >
                    <div className="flex items-center">
                      State
                      <SortIcon column="state" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("zip_code")}
                  >
                    <div className="flex items-center">
                      ZIP Code
                      <SortIcon column="zip_code" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center">
                      Phone
                      <SortIcon column="phone" />
                    </div>
                  </TableHead>
                  <TableHead>
                    Relative Phone
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("native_place")}
                  >
                    <div className="flex items-center">
                      Native Place
                      <SortIcon column="native_place" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Created At
                      <SortIcon column="created_at" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("gender")}
                  >
                    <div className="flex items-center">
                      Gender
                      <SortIcon column="gender" />
                    </div>
                  </TableHead>
                  <TableHead className="capitalize">
                    Marital Status
                  </TableHead>
                  <TableHead>Photo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center py-8 text-muted-foreground">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg, index) => {
                    return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-2">
                          <Switch
                            id={`verified-${reg.id}`}
                            checked={reg.verified}
                            onCheckedChange={() => handleToggleVerification(reg.id, reg.verified)}
                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{reg.serial_number || '-'}</TableCell>
                      <TableCell className="font-medium">{reg.first_name || '-'}</TableCell>
                      <TableCell>{reg.middle_name || '-'}</TableCell>
                      <TableCell className="font-medium">{reg.last_name || '-'}</TableCell>
                      <TableCell>
                        {reg.birthday
                          ? format(new Date(reg.birthday), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>{reg.city}</TableCell>
                      <TableCell>{reg.state}</TableCell>
                      <TableCell>{reg.zip_code}</TableCell>
                      <TableCell>{reg.phone}</TableCell>
                      <TableCell>{reg.relative_phone || '-'}</TableCell>
                      <TableCell>{reg.native_place}</TableCell>
                      <TableCell>
                        {reg.created_at
                          ? format(new Date(reg.created_at), 'MMM d, yyyy h:mm a')
                          : "-"}
                      </TableCell>
                      <TableCell className="capitalize">{reg.gender || '-'}</TableCell>
                      <TableCell className="capitalize">{reg.marital_status || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPhoto(reg.id)}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination and Page Size */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            {showCustomInput ? (
              <Input
                type="number"
                min="1"
                max="1000"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                onKeyDown={handleCustomLimitSubmit}
                onBlur={() => setShowCustomInput(false)}
                className="w-20 h-8 text-sm"
                placeholder="Custom"
                autoFocus
              />
            ) : (
              <Select 
                value={pagination.limit.toString()} 
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder={pagination.limit} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            )}
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          
          {pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (pagination.page > 1) {
                      handlePageChange(pagination.page - 1);
                    }
                  }}
                  className={
                    pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === -1 ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === pagination.page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (pagination.page < pagination.totalPages) {
                      handlePageChange(pagination.page + 1);
                    }
                  }}
                  className={
                    pagination.page === pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          )}
        </div>

        {/* Pagination Info */}
        <div className="text-sm text-muted-foreground text-center">
          Showing {registrations.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}{" "}
          to {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} entries
        </div>
      </div>

      {/* Photo Dialog */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPhoto(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Photo</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px]">
            {isPhotoLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : selectedPhoto?.url ? (
              <div className="relative w-full h-full min-h-[400px]">
                <Image
                  src={selectedPhoto.url}
                  alt="Registration photo"
                  fill
                  className="object-contain rounded-lg"
                  unoptimized
                />
              </div>
            ) : (
              <p className="text-muted-foreground">Failed to load photo</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

