"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useRef } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Upload, 
  User, 
  MapPin, 
  Phone, 
  Home, 
  Camera,
  Check,
  ChevronsUpDown,
  Plus,
  Youtube,
  Instagram
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Calendar = dynamic(
  () => import("@/components/ui/calendar").then((m) => m.Calendar),
  { ssr: false }
);

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  middleName: z.string().min(1, "Middle name is required").max(50, "Middle name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  gender: z.enum(["male", "female"]),
  maritalStatus: z.enum(["married", "unmarried"]),
  birthday: z.date({
    message: "Please select your birthday",
  }),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(4, "Valid ZIP code is required").max(10, "Valid ZIP code is required"),
  phoneCountryCode: z
    .string()
    .regex(/^\+\d{1,4}$/, "Invalid country code"),
  phoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^\d+$/, "Phone number must contain digits only"),
  // Conditional fields for females
  relativePhoneCountryCode: z
    .string()
    .regex(/^\+\d{1,4}$/, "Invalid country code")
    .optional(),
  relativePhoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^\d+$/, "Phone number must contain digits only")
    .optional(),
  nativePlace: z.string().min(2, "Native place is required"),
}).refine((data) => {
  // If gender is female, require relative phone number
  if (data.gender === "female" && !data.relativePhoneNumber) {
    return false;
  }
  return true;
}, {
  message: "Relative phone is required for females",
  path: ["relativePhoneNumber"],
});

type FormValues = z.infer<typeof formSchema>;

const INITIAL_NATIVE_PLACES = [
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
];

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

const INITIAL_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const COUNTRY_CODES = [
  { label: "India", value: "+91" },
  { label: "United States", value: "+1" },
  { label: "United Kingdom", value: "+44" },
  { label: "United Arab Emirates", value: "+971" },
  { label: "Canada", value: "+1" },
  { label: "Australia", value: "+61" },
  { label: "Singapore", value: "+65" },
];

export function RegistrationForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [nativePlaceOpen, setNativePlaceOpen] = useState(false);

  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [nativePlaces, setNativePlaces] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [citySearchValue, setCitySearchValue] = useState("");
  const [stateSearchValue, setStateSearchValue] = useState("");
  const [nativePlaceSearchValue, setNativePlaceSearchValue] = useState("");

  const [isCustomCity, setIsCustomCity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedCities = useMemo(() => [...cities].sort((a, b) => a.localeCompare(b)), [cities]);
  const sortedStates = useMemo(() => [...states].sort((a, b) => a.localeCompare(b)), [states]);
  const sortedNativePlaces = useMemo(
    () => [...nativePlaces].sort((a, b) => a.localeCompare(b)),
    [nativePlaces]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      gender: undefined,
      maritalStatus: undefined,
      street: "",
      city: "",
      state: "",
      zipCode: "",
      phoneCountryCode: "+91",
      phoneNumber: "",
      relativePhoneCountryCode: "+91",
      relativePhoneNumber: "",
      nativePlace: "",
    },
  });

  const genderValue = form.watch("gender");

  const cityValue = form.watch("city");

  // Fetch dropdown options from database on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [citiesRes, statesRes, nativePlacesRes] = await Promise.all([
          fetch("/api/dropdown-options?type=cities"),
          fetch("/api/dropdown-options?type=states"),
          fetch("/api/dropdown-options?type=native_places"),
        ]);

        const citiesData = await citiesRes.json();
        const statesData = await statesRes.json();
        const nativePlacesData = await nativePlacesRes.json();

        if (citiesData.options) setCities(citiesData.options);
        if (statesData.options) setStates(statesData.options);
        if (nativePlacesData.options) setNativePlaces(nativePlacesData.options);
      } catch (error) {
        console.error("Failed to fetch dropdown options:", error);
        // Fallback to initial values
        setCities(INITIAL_GUJARAT_CITIES);
        setStates(INITIAL_STATES_AND_UTS);
        setNativePlaces(INITIAL_NATIVE_PLACES);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError("Please select an image under 5MB");
        toast.error("File too large", {
          description: "Please select an image under 5MB",
        });
        return;
      }
      setPhotoFile(file);
      setPhotoError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addNewNativePlace = async (value: string) => {
    const v = value.trim();
    if (v.length < 2) {
      toast.error("Please enter a valid native place");
      return;
    }
    if (!nativePlaces.includes(v)) {
      try {
        const res = await fetch("/api/dropdown-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "native_places", name: v }),
        });
        if (res.ok) {
          setNativePlaces((prev) => [...prev, v]);
          toast.success(`Added "${v}" to native places`);
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        toast.error("Failed to save native place");
      }
    }
    form.setValue("nativePlace", v, { shouldValidate: true, shouldDirty: true });
    setNativePlaceOpen(false);
  };

  const addNewCity = async (value: string) => {
    const v = value.trim();
    if (v.length < 2) {
      toast.error("Please enter a valid city");
      return;
    }

    if (!cities.includes(v)) {
      try {
        const res = await fetch("/api/dropdown-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "cities", name: v }),
        });
        if (res.ok) {
          setCities((prev) => [...prev, v]);
          toast.success(`Added "${v}" to cities`);
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        toast.error("Failed to save city");
      }
    }

    setIsCustomCity(true);
    form.setValue("city", v, { shouldValidate: true, shouldDirty: true });
    // Don't auto-set state - allow custom entry

    setCityOpen(false);
  };

  const addNewState = async (value: string) => {
    const v = value.trim();
    if (v.length < 2) {
      toast.error("Please enter a valid state");
      return;
    }
    if (!states.includes(v)) {
      try {
        const res = await fetch("/api/dropdown-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "states", name: v }),
        });
        if (res.ok) {
          setStates((prev) => [...prev, v]);
          toast.success(`Added "${v}" to states`);
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        toast.error("Failed to save state");
      }
    }
    form.setValue("state", v, { shouldValidate: true, shouldDirty: true });
    setStateOpen(false);
  };

  const onSubmit = async (data: FormValues) => {
    if (!photoFile) {
      setPhotoError("Please upload your photo");
      toast.error("Photo required", {
        description: "Please upload your photo",
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const phone = `${data.phoneCountryCode}${data.phoneNumber}`;

      const body = new FormData();
      body.set("firstName", data.firstName);
      body.set("middleName", data.middleName);
      body.set("lastName", data.lastName);
      body.set("gender", data.gender);
      body.set("maritalStatus", data.maritalStatus);
      body.set("birthday", data.birthday.toISOString().slice(0, 10));
      body.set("street", data.street);
      body.set("city", data.city);
      body.set("state", data.state);
      body.set("zipCode", data.zipCode);
      body.set("phone", phone);
      
      // Add conditional phone field for females
      if (data.gender === "female") {
        if (data.relativePhoneNumber && data.relativePhoneCountryCode) {
          body.set("relativePhone", `${data.relativePhoneCountryCode}${data.relativePhoneNumber}`);
        }
      }
      
      body.set("nativePlace", data.nativePlace);
      body.set("photo", photoFile);

      const res = await fetch("/api/registrations", {
        method: "POST",
        body,
      });

      const json = (await res.json().catch(() => null)) as
        | { ok: true; id: string; serialNumber?: string }
        | { error: string }
        | null;

      if (!res.ok) {
        const message = json && "error" in json ? json.error : "Request failed";
        toast.error("Registration failed", { description: message });
        return;
      }

      toast.success("Registration Successful!", {
        description: "Jay Swaminarayan! Your registration has been submitted.",
      });

      form.reset();
      setPhotoPreview(null);
      setPhotoFile(null);
      setPhotoError(null);
      if (json && "ok" in json && json.ok) {
        // Use serialNumber if available, otherwise fall back to id
        const identifier = json.serialNumber || json.id;
        router.push(`/success?serialNumber=${encodeURIComponent(identifier)}`);
      } else {
        router.push("/success");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Registration failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Fields */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <FormLabel className="flex items-center gap-2 text-foreground font-medium">
            <User className="w-4 h-4 text-secondary" />
            Name
          </FormLabel>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="First name"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Auto-capitalize first letter
                        const capitalized = value.length > 0 
                          ? value.charAt(0).toUpperCase() + value.slice(1)
                          : value;
                        field.onChange(capitalized);
                      }}
                      className="bg-card border-border focus:border-primary focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Middle Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Middle name"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Auto-capitalize first letter
                        const capitalized = value.length > 0 
                          ? value.charAt(0).toUpperCase() + value.slice(1)
                          : value;
                        field.onChange(capitalized);
                      }}
                      className="bg-card border-border focus:border-primary focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Last Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Last name"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Auto-capitalize first letter
                        const capitalized = value.length > 0 
                          ? value.charAt(0).toUpperCase() + value.slice(1)
                          : value;
                        field.onChange(capitalized);
                      }}
                      className="bg-card border-border focus:border-primary focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Gender Field */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <FormLabel className="flex items-center gap-2 text-foreground font-medium">
            <User className="w-4 h-4 text-secondary" />
            Gender
          </FormLabel>
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${field.value === 'male' ? 'border-primary' : 'border-border'}`}>
                        {field.value === 'male' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                      </div>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={field.value === 'male'}
                        onChange={() => {
                          field.onChange('male');
                          // Clear female-specific fields when switching to male
                          form.setValue("relativePhoneNumber", "");
                        }}
                      />
                      <span className="text-sm">Male</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${field.value === 'female' ? 'border-primary' : 'border-border'}`}>
                        {field.value === 'female' && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                      </div>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={field.value === 'female'}
                        onChange={() => field.onChange('female')}
                      />
                      <span className="text-sm">Female</span>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Marital Status Field */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.16s" }}>
          <FormLabel className="flex items-center gap-2 text-foreground font-medium">
            <User className="w-4 h-4 text-secondary" />
            Marital Status
          </FormLabel>
          <FormField
            control={form.control}
            name="maritalStatus"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-wrap gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="married" id="married" />
                      <Label htmlFor="married" className="cursor-pointer text-sm font-normal">
                        Married
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unmarried" id="unmarried" />
                      <Label htmlFor="unmarried" className="cursor-pointer text-sm font-normal">
                        Unmarried
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Birthday Field */}
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem className="flex flex-col animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <FormLabel className="flex items-center gap-2 text-foreground font-medium">
                <CalendarIcon className="w-4 h-4 text-secondary" />
                Birthday
              </FormLabel>
              <Popover open={birthdayOpen} onOpenChange={setBirthdayOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-card border-border",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select your birthday</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-2 shadow-2xl bg-popover opacity-100" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (!date) return;
                      field.onChange(date);
                      setBirthdayOpen(false);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto bg-popover")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Fields */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <FormLabel className="flex items-center gap-2 text-foreground font-medium">
            <Home className="w-4 h-4 text-secondary" />
            Address
          </FormLabel>
          
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Street Address"
                    {...field}
                    className="bg-card border-border focus:border-primary focus:ring-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between bg-card border-border font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? field.value : "Select city"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-2 shadow-2xl bg-popover opacity-100">
                        <Command className="bg-popover opacity-100">
                          <CommandInput
                            placeholder="Search city..."
                            onValueChange={setCitySearchValue}
                          />
                          <CommandList>
                            <CommandEmpty className="p-0">
                              <Button
                                variant="ghost"
                                className="w-full justify-start font-normal px-2 py-3 h-auto"
                                onClick={() => addNewCity(citySearchValue)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add &quot;{citySearchValue}&quot;
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {sortedCities.map((city) => (
                                <CommandItem
                                  value={city}
                                  key={city}
                                  onSelect={() => {
                                    form.setValue("city", city, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                    // Don't auto-set state - allow custom entry
                                    setCityOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      city === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {city}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Popover
                      open={stateOpen}
                      onOpenChange={setStateOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between bg-card border-border font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? field.value : "Select state"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-2 shadow-2xl bg-popover opacity-100">
                        <Command className="bg-popover opacity-100">
                          <CommandInput
                            placeholder="Search state..."
                            onValueChange={setStateSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty className="p-0">
                              <Button
                                variant="ghost"
                                className="w-full justify-start font-normal px-2 py-3 h-auto"
                                onClick={() => addNewState(stateSearchValue)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add &quot;{stateSearchValue}&quot;
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {sortedStates.map((stateName) => (
                                <CommandItem
                                  value={stateName}
                                  key={stateName}
                                  onSelect={() => {
                                    form.setValue("state", stateName, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                    setStateOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      stateName === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {stateName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="ZIP Code"
                    {...field}
                    className="bg-card border-border focus:border-primary focus:ring-primary/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <FormLabel className="flex items-center gap-2 text-foreground font-medium">
            <Phone className="w-4 h-4 text-secondary" />
            Phone Number
          </FormLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="phoneCountryCode"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="bg-card border-border">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={`${c.label}-${c.value}`} value={c.value}>
                            {c.label} ({c.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormControl>
                    <Input
                      placeholder="Enter phone number"
                      type="tel"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, "");
                        field.onChange(next);
                      }}
                      className="bg-card border-border focus:border-primary focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Conditional Phone Field for Females */}
        {genderValue === "female" && (
          <>
            {/* Relative's Phone (Brother's/Husband's/Father's) */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.42s" }}>
              <FormLabel className="flex items-center gap-2 text-foreground font-medium">
                <Phone className="w-4 h-4 text-secondary" />
                Relative's Phone (Brother's/Husband's/Father's) <span className="text-destructive">*</span>
              </FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="relativePhoneCountryCode"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger className="bg-card border-border">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_CODES.map((c) => (
                              <SelectItem key={`relative-${c.label}-${c.value}`} value={c.value}>
                                {c.label} ({c.value})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relativePhoneNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input
                          placeholder="Enter relative's phone number"
                          type="tel"
                          inputMode="numeric"
                          {...field}
                          onChange={(e) => {
                            const next = e.target.value.replace(/\D/g, "");
                            field.onChange(next);
                          }}
                          className="bg-card border-border focus:border-primary focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Native Place Field */}
        <FormField
          control={form.control}
          name="nativePlace"
          render={({ field }) => (
            <FormItem className="flex flex-col animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <FormLabel className="flex items-center gap-2 text-foreground font-medium">
                <MapPin className="w-4 h-4 text-secondary" />
                Native Place
              </FormLabel>
              <Popover open={nativePlaceOpen} onOpenChange={setNativePlaceOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between bg-card border-border font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? nativePlaces.find((place) => place === field.value) || field.value
                        : "Select native place"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-2 shadow-2xl bg-popover opacity-100">
                  <Command className="bg-popover opacity-100">
                    <CommandInput 
                      placeholder="Search native place..." 
                      onValueChange={setNativePlaceSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty className="p-0">
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal px-2 py-3 h-auto"
                          onClick={() => addNewNativePlace(nativePlaceSearchValue)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add &quot;{nativePlaceSearchValue}&quot;
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {sortedNativePlaces.map((place) => (
                          <CommandItem
                            value={place}
                            key={place}
                            onSelect={() => {
                              form.setValue("nativePlace", place, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                              setNativePlaceOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                place === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {place}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photo Upload */}
        <div className="animate-fade-in" style={{ animationDelay: "0.55s" }}>
          <FormLabel className="flex items-center gap-2 text-foreground font-medium justify-center">
            <Camera className="w-4 h-4 text-secondary" />
            Photo
          </FormLabel>
          <div className="flex flex-col items-center mt-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative w-32 h-32 rounded-full border-4 border-secondary cursor-pointer",
                "flex items-center justify-center overflow-hidden",
                "bg-cream transition-all duration-300 hover:border-primary hover:shadow-elevated",
                "group"
              )}
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs">Add Photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground mt-2">Click to upload photo or take picture</p>
            {photoError ? (
              <p className="text-sm font-medium text-destructive mt-2">{photoError}</p>
            ) : null}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="sacred"
          size="lg"
          className="w-full mt-8 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </Button>
        
        {/* Social Media Links */}
        <div className="flex justify-center gap-6 mt-6 animate-fade-in" style={{ animationDelay: "0.65s" }}>
          <a 
            href="https://youtube.com/@smsm73933?si=IWusOGGmLXzH8uFA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-[#FF0000] transition-colors"
          >
            <Youtube className="w-5 h-5" />
            <span className="text-sm font-medium">YouTube</span>
          </a>
          <a 
            href="https://www.instagram.com/smsm_morbi/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-[#E4405F] transition-colors"
          >
            <Instagram className="w-5 h-5" />
            <span className="text-sm font-medium">Instagram</span>
          </a>
        </div>
      </form>
    </Form>
  );
}
