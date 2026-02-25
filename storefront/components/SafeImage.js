import { useState } from 'react';

const SafeImage = ({
  src,
  alt,
  width,
  height,
  fill,
  className,
  style,
  sizes,
  placeholder = "blur",
  priority = false,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  // Default blur placeholder
  const defaultBlurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNjAwJyBoZWlnaHQ9JzQwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCBmaWxsPSIjZWVlIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+";

  // If there's an error or no src, show placeholder
  if (imageError || !src) {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '0.875rem',
          width: fill ? '100%' : width || '100%',
          height: fill ? '100%' : height || '200px',
        }}
      >
        No Image
      </div>
    );
  }

  // Always ensure we have proper dimensions or fill
  const shouldUseFill = fill || (!width && !height);
  const safeWidth = width || 600;
  const safeHeight = height || 400;

  if (shouldUseFill) {
    return (
      <img
        src={src}
        alt={alt || 'Product image'}
        className={className}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          ...style
        }}
        onError={() => setImageError(true)}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Product image'}
      width={safeWidth}
      height={safeHeight}
      className={className}
      style={{
        objectFit: 'cover',
        ...style
      }}
      onError={() => setImageError(true)}
      {...props}
    />
  );
};

export default SafeImage;
