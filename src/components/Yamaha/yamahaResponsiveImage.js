const motorcycleImages = {
  '/imgs/1.%20Yamaha%20YZF-R1.webp': { name: 'yzf-r1', width: 1536, height: 1024 },
  '/imgs/2.%20Yamaha%20YZF-R7.webp': { name: 'yzf-r7', width: 1536, height: 1024 },
  '/imgs/3.%20Yamaha%20MT-09.webp': { name: 'mt-09', width: 1536, height: 1024 },
  '/imgs/6.%20Yamaha%20XSR900.webp': { name: 'xsr900', width: 1536, height: 1024 },
  '/imgs/Yamaha%20R15M.webp': { name: 'r15m', width: 1536, height: 1024 },
  '/imgs/Yamaha%20T%C3%A9n%C3%A9r%C3%A9%20700.webp': { name: 'tenere-700', width: 1372, height: 1147 },
  '/imgs/Yamaha%20TRACER%209%20GT.webp': { name: 'tracer-9-gt', width: 1536, height: 1024 },
};

export function getResponsiveMotorcycleImageProps(src, sizes = '(max-width: 650px) 100vw, 50vw') {
  const image = motorcycleImages[src];
  if (!image) return {};

  return {
    srcSet: `/imgs/responsive/${image.name}-840.webp 840w, /imgs/responsive/${image.name}-${image.width}.webp ${image.width}w`,
    sizes,
    width: image.width,
    height: image.height,
  };
}
