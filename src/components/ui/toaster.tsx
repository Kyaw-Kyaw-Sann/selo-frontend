import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      position="top-right"
      richColors
      closeButton
      duration={5000}
    />
  )
}