import Image from "next/image";
import { RegistrationForm } from "@/components/RegistrationForm";
import DecorativePattern from "@/components/DecorativePattern";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-cream-dark pointer-events-none" />
      
      <DecorativePattern />

      <div className="relative z-10 container max-w-lg mx-auto px-4 py-12 pb-16">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          {/* Logo - matches form box width */}
          <div className="mb-6">
            <div className="ornate-border bg-card p-6 md:p-8 shadow-card rounded-lg">
              <Image
                src="/smsm-logo.png"
                alt="Shri Swaminarayan Mandir"
                width={512}
                height={512}
                className="w-full h-auto object-contain animate-float drop-shadow-lg"
                priority
              />
            </div>
          </div>

          {/* Sanskrit blessing */}
          <p className="text-sm text-secondary font-medium tracking-wide mb-2">
            ॥ श्री स्वामिनारायणो विजयतेतराम् ॥
          </p>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            SSYV Community Registration
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            श्री स्वामिनारायण युवावृंद सम्मेलन
          </p>
          
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary" />
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary" />
          </div>
        </header>

        {/* Registration Card */}
        <main className="ornate-border bg-card p-6 md:p-8 shadow-card animate-scale-in">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Registration Form
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please fill in your details below
            </p>
          </div>

          <RegistrationForm />
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.7s" }}>
          <p className="text-xs text-muted-foreground">
            SMSM Parivar
          </p>
          <p className="text-xs text-secondary font-medium mt-2">
            🙏 Jay Swaminarayan 🙏
          </p>
        </footer>
      </div>
    </div>
  );
}
