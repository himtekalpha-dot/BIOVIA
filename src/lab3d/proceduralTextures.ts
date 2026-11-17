import * as THREE from 'three';

export function createOrganicBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Deterministic organic cellular micro-relief pattern
    let seed = 4219;
    const nextRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 220; i++) {
      const x = nextRand() * size;
      const y = nextRand() * size;
      const r = 6 + nextRand() * 18;
      const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
      const shade = Math.floor(110 + nextRand() * 55);
      grad.addColorStop(0, `rgb(${shade},${shade},${shade})`);
      grad.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = Math.max(1, maxAnisotropy);
  return texture;
}

export function createLabFloorTexture(
  maxAnisotropy: number,
  darkTheme: boolean
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = darkTheme ? '#0f233c' : '#d8e6f1';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = darkTheme ? 'rgba(94, 227, 236, 0.14)' : 'rgba(20, 74, 112, 0.12)';
    ctx.lineWidth = 1.5;

    const step = 64;
    for (let p = 0; p <= size; p += step) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }

    ctx.strokeStyle = darkTheme ? 'rgba(94, 227, 236, 0.25)' : 'rgba(14, 139, 160, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.anisotropy = Math.max(1, maxAnisotropy);
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(6, 18, 34, 0.52)');
    grad.addColorStop(0.55, 'rgba(6, 18, 34, 0.22)');
    grad.addColorStop(1, 'rgba(6, 18, 34, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
