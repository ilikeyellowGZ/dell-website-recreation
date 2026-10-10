import type { ImgHTMLAttributes } from 'react'
import type { ResponsiveImageAsset } from '../imageAssets'

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'height' | 'loading' | 'src' | 'srcSet' | 'width'> & {
  eager?: boolean
  image: ResponsiveImageAsset
}

export function ResponsiveImage({ eager = false, image, ...props }: ResponsiveImageProps) {
  return (
    <img
      {...props}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      height={image.height}
      loading={eager ? 'eager' : 'lazy'}
      src={image.src}
      srcSet={image.srcSet}
      width={image.width}
    />
  )
}
