import React, { useState } from 'react';
import { getResponsiveMotorcycleImageProps } from './yamahaResponsiveImage.js';

function YamahaBikeImage({ src, alt, className = '', loading = 'lazy', sizes }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`yamaha-bike-image-fallback ${className}`} role="img" aria-label={`${alt} image unavailable`}>
        <span aria-hidden="true">YAMAHA</span>
        <small>IMAGE UNAVAILABLE</small>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      {...getResponsiveMotorcycleImageProps(src, sizes)}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default YamahaBikeImage;
