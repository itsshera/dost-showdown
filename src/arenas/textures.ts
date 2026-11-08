import * as THREE from 'three'

export function makeSignTexture(
  text: string,
  color: string,
  options: { bg?: string; fontSize?: number; width?: number; height?: number; sub?: string } = {},
) {
  const width = options.width ?? 512
  const height = options.height ?? 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = options.bg ?? 'rgba(4,4,14,0.94)'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = color
  ctx.lineWidth = 8
  ctx.strokeRect(10, 10, width - 20, height - 20)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 26
  ctx.fillStyle = color
  ctx.font = `bold ${options.fontSize ?? 96}px Impact, "Arial Black", sans-serif`
  ctx.fillText(text, width / 2, options.sub ? height * 0.42 : height * 0.5)

  if (options.sub) {
    ctx.shadowBlur = 10
    ctx.fillStyle = '#e2e8f0'
    ctx.font = `bold ${Math.floor((options.fontSize ?? 96) * 0.34)}px Rajdhani, Arial, sans-serif`
    ctx.fillText(options.sub, width / 2, height * 0.72)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function makeCheckerTexture(a: string, b: string, repeatX = 10, repeatY = 6) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.fillStyle = a
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = b
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillRect(64, 64, 64, 64)
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function makeStreetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.fillStyle = '#2a1620'
  ctx.fillRect(0, 0, 512, 512)
  const tiles = 8
  const size = 512 / tiles
  for (let y = 0; y < tiles; y += 1) {
    for (let x = 0; x < tiles; x += 1) {
      const warm = (x + y) % 2 === 0
      ctx.fillStyle = warm ? '#3b2028' : '#331b23'
      ctx.fillRect(x * size + 2, y * size + 2, size - 4, size - 4)
    }
  }
  ctx.strokeStyle = 'rgba(251,191,36,0.16)'
  ctx.lineWidth = 3
  for (let i = 0; i <= tiles; i += 1) {
    ctx.beginPath()
    ctx.moveTo(i * size, 0)
    ctx.lineTo(i * size, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * size)
    ctx.lineTo(512, i * size)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 2)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function makePosterTexture(title: string, sub: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 420
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.fillStyle = '#f5e9cf'
  ctx.fillRect(0, 0, 320, 420)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 320, 70)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 34px Impact, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, 160, 48)
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 46px Impact, sans-serif'
  ctx.fillText('SURPRISE', 160, 180)
  ctx.font = '28px Rajdhani, sans-serif'
  ctx.fillText(sub, 160, 235)
  ctx.strokeStyle = color
  ctx.lineWidth = 10
  ctx.strokeRect(18, 18, 284, 384)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(160, 320, 46, 0, Math.PI * 2)
  ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
