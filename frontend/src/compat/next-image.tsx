import type { ImgHTMLAttributes } from 'react';

interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}

export default function Image({ fill, priority, style, width, height, ...props }: ImageProps): JSX.Element {
  const fillStyle = fill ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', ...style } : style;
  return <img {...props} width={width} height={height} style={fillStyle} loading={priority ? 'eager' : 'lazy'} />;
}