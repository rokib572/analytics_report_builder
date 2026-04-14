import { Toaster as SonnerToaster } from "sonner"

export const Toaster = () => (
  <SonnerToaster
    position="top-right"
    richColors
    toastOptions={{
      classNames: {
        toast: "border bg-card text-card-foreground",
        description: "text-muted-foreground",
      },
    }}
  />
)
