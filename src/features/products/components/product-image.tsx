import { useState } from 'react'
import { ImageOff } from 'lucide-react'

type ProductImageProps = {
  imagePath: string | null
  name: string
  className?: string
}

export default function ProductImage({ imagePath, name, className = 'size-10' }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const src = imagePath?.trim() || null

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-border bg-surface ${className}`}>
      {src && src !== failedSrc ? (
        <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} className="size-full object-contain p-1" />
      ) : (
        <span role="img" aria-label={`Image unavailable for ${name}`} className="flex size-full items-center justify-center bg-surface-muted text-muted">
          <ImageOff size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
    </div>
  )
}
