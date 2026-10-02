import type { CSSProperties } from 'react'
import { assets } from '../assets'

type Crop = {
  x: number
  y: number
  width: number
  height: number
}

type ReferencePhotoProps = {
  alt: string
  className?: string
  crop: Crop
  eager?: boolean
  frame?: Pick<Crop, 'width' | 'height'>
}

export function ReferencePhoto({ alt, className = '', crop, eager = false, frame }: ReferencePhotoProps) {
  const style: CSSProperties = {
    aspectRatio: `${frame?.width ?? crop.width} / ${frame?.height ?? crop.height}`,
  }
  const imageStyle: CSSProperties = {
    width: `${(1024 / crop.width) * 100}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
  }

  return (
    <div className={`reference-photo ${className}`.trim()} style={style}>
      <img
        alt={alt}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
        height="1536"
        loading={eager ? 'eager' : 'lazy'}
        src={assets.aboutReference}
        style={imageStyle}
        width="1024"
      />
    </div>
  )
}
