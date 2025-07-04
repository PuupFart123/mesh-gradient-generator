import React, { useRef, useEffect } from 'react';

// Helper: interpolate between 3 colors using barycentric coordinates
function barycentricColor(c0, c1, c2, w0, w1, w2) {
  return [
    Math.round(c0[0] * w0 + c1[0] * w1 + c2[0] * w2),
    Math.round(c0[1] * w0 + c1[1] * w1 + c2[1] * w2),
    Math.round(c0[2] * w0 + c1[2] * w1 + c2[2] * w2),
  ];
}

// Convert hex to [r,g,b]
function hexToRgb(hex) {
  const m = hex.match(/^#([0-9a-f]{3,8})$/i);
  if (!m) return [0,0,0];
  let c = m[1];
  if (c.length === 3) c = c.split('').map(x=>x+x).join('');
  if (c.length === 6) c += 'ff';
  const num = parseInt(c, 16);
  return [(num>>24)&255, (num>>16)&255, (num>>8)&255].slice(-3);
}

// Generate a grid of points
function createGrid(cols, rows, width, height) {
  const points = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      points.push({
        x: (x / (cols - 1)) * width,
        y: (y / (rows - 1)) * height,
        baseX: (x / (cols - 1)) * width,
        baseY: (y / (rows - 1)) * height,
        dx: (Math.random() - 0.5) * 0.7,
        dy: (Math.random() - 0.5) * 0.7,
        color: '#fff',
      });
    }
  }
  return points;
}

// Assign colors to random points, interpolate for the rest
function assignColorsToGrid(points, colors) {
  // Pick random indices for anchor colors
  const indices = [];
  while (indices.length < colors.length) {
    const idx = Math.floor(Math.random() * points.length);
    if (!indices.includes(idx)) indices.push(idx);
  }
  // Assign anchor colors
  indices.forEach((idx, i) => {
    points[idx].color = colors[i];
  });
  // Interpolate for the rest
  points.forEach((p, i) => {
    if (indices.includes(i)) return;
    // Find nearest anchor
    let minD = 1e9, minIdx = 0;
    indices.forEach((idx, j) => {
      const d = Math.hypot(points[idx].x - p.x, points[idx].y - p.y);
      if (d < minD) { minD = d; minIdx = idx; }
    });
    p.color = points[minIdx].color;
  });
}

// Triangulate the grid (simple quad split)
function triangulate(cols, rows) {
  const tris = [];
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const i = y * cols + x;
      // Triangle 1: top-left, top-right, bottom-left
      tris.push([i, i + 1, i + cols]);
      // Triangle 2: top-right, bottom-right, bottom-left
      tris.push([i + 1, i + cols + 1, i + cols]);
    }
  }
  return tris;
}

const MeshGradient = ({ colors, width = 900, height = 500 }) => {
  const canvasRef = useRef();
  const gridRef = useRef();
  const trisRef = useRef();
  const cols = 6;
  const rows = 5;

  useEffect(() => {
    // Create grid and assign colors
    const grid = createGrid(cols, rows, width, height);
    assignColorsToGrid(grid, colors);
    gridRef.current = grid;
    trisRef.current = triangulate(cols, rows);
  }, [colors, width, height]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let animationId;
    function animate() {
      // Animate points
      gridRef.current.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        // Spring back to base
        p.x += (p.baseX - p.x) * 0.01;
        p.y += (p.baseY - p.y) * 0.01;
        // Bounce off edges
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
      });
      // Draw mesh
      ctx.clearRect(0, 0, width, height);
      trisRef.current.forEach(([i0, i1, i2]) => {
        const p0 = gridRef.current[i0];
        const p1 = gridRef.current[i1];
        const p2 = gridRef.current[i2];
        // Draw triangle with color interpolation
        // Sample triangle area (coarse for perf)
        const step = 1; // pixel-perfect
        const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
        const maxX = Math.min(width, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
        const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
        const maxY = Math.min(height, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
        const c0 = hexToRgb(p0.color);
        const c1 = hexToRgb(p1.color);
        const c2 = hexToRgb(p2.color);
        const epsilon = 1e-2;
        for (let y = minY; y < maxY; y += step) {
          for (let x = minX; x < maxX; x += step) {
            // Barycentric coordinates
            const denom = ((p1.y - p2.y)*(p0.x - p2.x) + (p2.x - p1.x)*(p0.y - p2.y));
            const w0 = ((p1.y - p2.y)*(x - p2.x) + (p2.x - p1.x)*(y - p2.y)) / denom;
            const w1 = ((p2.y - p0.y)*(x - p2.x) + (p0.x - p2.x)*(y - p2.y)) / denom;
            const w2 = 1 - w0 - w1;
            if (w0 >= -epsilon && w1 >= -epsilon && w2 >= -epsilon) {
              const rgb = barycentricColor(c0, c1, c2, w0, w1, w2);
              ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
              ctx.fillRect(x, y, step, step);
            }
          }
        }
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [colors, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: 'auto', borderRadius: '1.5rem', display: 'block' }} />;
};

export default MeshGradient; 