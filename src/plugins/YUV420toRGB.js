//https://gist.github.com/ryohey/ee6a4d9a7293d66944b1ef9489807783

export function yuv420ProgPlanarToRgb(yuv, width, height) {
  const frameSize = width * height
  const halfWidth = Math.floor(width / 2)
  const uStart = frameSize
  const vStart = frameSize + Math.floor(frameSize / 4)
  const rgb = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const yy = yuv[y * width + x]
      const colorIndex = Math.floor(y / 2) * halfWidth + Math.floor(x / 2)
      const uu = yuv[uStart + colorIndex] - 128
      const vv = yuv[vStart + colorIndex] - 128

      let r = yy + 1.402 * vv
      let g = yy - 0.344 * uu - 0.714 * vv
      let b = yy + 1.772 * uu

      rgb.push(r)
      rgb.push(g)
      rgb.push(b)
    }
  }

  return rgb
}

export function putRGBToRGBA(rgba, rgb, width, height) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      const indexRGB = index * 3
      const indexRGBA = index * 4
      rgba[indexRGBA + 0] = rgb[indexRGB + 0] // r
      rgba[indexRGBA + 1] = rgb[indexRGB + 1] // g
      rgba[indexRGBA + 2] = rgb[indexRGB + 2] // b
      rgba[indexRGBA + 3] = 255 // alpha
    }
  }
}
