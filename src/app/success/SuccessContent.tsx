"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Youtube, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-cream-dark pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full bg-card p-8 rounded-xl shadow-card border border-border/50 text-center animate-scale-in">
        {/* Success Animation */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-500"
          >
            <motion.div
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
            </motion.div>
          </motion.div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Registration Successful!
        </h1>
        <p className="text-muted-foreground mb-8">
          Thank you for registering. Your details have been submitted successfully.
        </p>
        {userId && (
          <p className="text-sm text-muted-foreground mt-2">
            Your registration ID: <span className="font-mono text-black font-medium">{userId}</span>
          </p>
        )}

        {/* Social Media Subscription */}
        <div className="bg-secondary/5 rounded-lg p-6 mb-8 border border-secondary/10">
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
            Stay Connected
          </h2>
          <div className="grid gap-3">
            <a
              href="https://youtube.com/@smsm73933?si=IWusOGGmLXzH8uFA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#FF0000] hover:bg-[#FF0000]/90 text-white py-3 px-4 rounded-md transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Youtube className="w-5 h-5" />
              <span className="font-medium">Subscribe on YouTube</span>
            </a>
            
            <a
              href="https://www.instagram.com/smsm_morbi/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white py-3 px-4 rounded-md transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-medium">Follow on Instagram</span>
            </a>
          </div>
        </div>

        {/* Submit Another Response */}
        <Link href="/">
          <Button variant="outline" className="w-full gap-2">
            Submit Another Response
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-secondary font-medium">
            🙏 Jay Swaminarayan 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
