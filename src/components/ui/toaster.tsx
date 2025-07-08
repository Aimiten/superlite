import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, Bell, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getToastIcon = (variant: string | undefined) => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-teal-500" />
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "info":
        return <Bell className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            variant={variant} 
            aria-live={variant === "destructive" ? "assertive" : "polite"}
            role={variant === "destructive" ? "alert" : "status"}
            {...props}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-sm">
                {getToastIcon(variant)}
              </div>
              <div>
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}