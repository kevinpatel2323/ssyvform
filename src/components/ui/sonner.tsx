"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:border group-[.toaster]:border-border',
          title: 'font-medium',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/80',
          // Specific toast variants
          success: 'bg-green-50 border-green-200 text-green-900',
          error: 'bg-red-50 border-red-200 text-red-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="h-4 w-4 text-green-600" />,
        info: <InfoIcon className="h-4 w-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="h-4 w-4 text-yellow-600" />,
        error: <OctagonXIcon className="h-4 w-4 text-red-600" />,
        loading: <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />,
      }}
      position="top-center"
      visibleToasts={5}
      gap={8}
      {...props}
    />
  )
}

export { Toaster }
