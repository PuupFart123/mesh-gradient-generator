import chroma from 'chroma-js';

// Generate n maximally distinct, harmonious colors based on userColors
export function generatePalette(userColors, totalColors) {
  // Always generate enough auto-colors so palette is exactly totalColors
  const needed = totalColors - userColors.length;
  let autoColors = [];
  
  // Get user color HSLs and analyze the palette
  const userHSL = userColors.map(c => chroma(c).hsl());
  const userHues = userHSL.map(hsl => hsl[0]);
  const userSaturations = userHSL.map(hsl => hsl[1]);
  const userLightnesses = userHSL.map(hsl => hsl[2]);
  
  // Calculate palette characteristics
  const avgSaturation = userSaturations.length > 0 ? userSaturations.reduce((a, b) => a + b, 0) / userSaturations.length : 0.75;
  const avgLightness = userLightnesses.length > 0 ? userLightnesses.reduce((a, b) => a + b, 0) / userLightnesses.length : 0.5;
  const hueRange = userHues.length > 0 ? Math.max(...userHues) - Math.min(...userHues) : 0;
  
  // Determine harmony strategy based on user colors
  let harmonyStrategy = 'complementary';
  if (hueRange < 60) {
    harmonyStrategy = 'analogous'; // Colors are close together
  } else if (hueRange > 180) {
    harmonyStrategy = 'triadic'; // Colors are spread out
  }
  
  // Detect if white or a very light color is present
  const hasWhite = userHSL.some(hsl => hsl[2] > 0.85 && hsl[1] < 0.2); // very light and low saturation
  
  let allHues = [...userHues];
  // Calculate average user hue for harmony bias
  const avgHue = userHues.length > 0 ? userHues.reduce((a, b) => a + b, 0) / userHues.length : 180;
  
  for (let i = 0; i < needed; i++) {
    let bestHue = 0;
    let bestScore = -1;
    for (let h = 0; h < 360; h += 5) {
      let score;
      if (hasWhite) {
        // If white is present, favor analogous or pastel hues, avoid strong complements
        score = 0;
        const minDistances = userHues.map(uh => {
          let d = Math.abs(h - uh);
          d = Math.min(d, 360 - d);
          return d;
        });
        const minDist = Math.min(...minDistances);
        // Prefer analogous (within 60deg)
        if (minDist < 60) score += 100 - minDist;
        // Prefer split-complementary (150-210deg)
        if (minDist > 150 && minDist < 210) score += 60 - Math.abs(minDist - 180);
        // Penalize strong complements (170-190deg)
        if (minDist > 170 && minDist < 190) score -= 80;
        // Bonus for even distribution
        score += minDist * 0.5;
        // Bias toward average user hue for extra harmony
        const hueBias = Math.min(Math.abs(h - avgHue), 360 - Math.abs(h - avgHue));
        score += 40 - hueBias * 0.3;
      } else {
        score = calculateHarmonyScore(h, userHues, harmonyStrategy, i);
        // Bias toward average user hue for extra harmony
        const hueBias = Math.min(Math.abs(h - avgHue), 360 - Math.abs(h - avgHue));
        score += 20 - hueBias * 0.15;
      }
      if (score > bestScore) {
        bestScore = score;
        bestHue = h;
      }
    }
    // More variable, vibrant, but still harmonious color generation
    let finalSaturation = hasWhite
      ? Math.random() * 0.43 + 0.22 // 0.22–0.65
      : Math.random() * 0.57 + 0.28; // 0.28–0.85
    let finalLightness = hasWhite
      ? Math.random() * 0.31 + 0.65 // 0.65–0.96
      : Math.random() * 0.37 + 0.55; // 0.55–0.92
    if (totalColors >= 6) {
      finalSaturation = hasWhite
        ? Math.random() * 0.43 + 0.22 // 0.22–0.65
        : Math.random() * 0.57 + 0.28; // 0.28–0.85
      finalLightness = hasWhite
        ? Math.random() * 0.31 + 0.65 // 0.65–0.96
        : Math.random() * 0.37 + 0.55; // 0.55–0.92
      // Ensure this color is distinct from existing ones
      const existingHSL = [...userHSL, ...autoColors.map(c => chroma(c).hsl())];
      let attempts = 0;
      while (attempts < 10) {
        const isDistinct = existingHSL.every(existing => {
          const hueDist = Math.min(Math.abs(bestHue - existing[0]), Math.abs(bestHue - existing[0] + 360), Math.abs(bestHue - existing[0] - 360));
          const satDist = Math.abs(finalSaturation - existing[1]);
          const lightDist = Math.abs(finalLightness - existing[2]);
          return hueDist > 60 || satDist > 0.15 || lightDist > 0.15;
        });
        if (isDistinct) break;
        finalSaturation = hasWhite
          ? Math.random() * 0.43 + 0.22
          : Math.random() * 0.57 + 0.28;
        finalLightness = hasWhite
          ? Math.random() * 0.31 + 0.65
          : Math.random() * 0.37 + 0.55;
        attempts++;
      }
    }
    const newColor = chroma.hsl(bestHue, finalSaturation, finalLightness).hex();
    autoColors.push(newColor);
    allHues.push(bestHue);
  }
  // Interleave user and auto-colors for better distribution, but always return exactly totalColors
  const palette = [];
  let u = 0, a = 0;
  for (let i = 0; i < totalColors; i++) {
    if ((i % 2 === 0 && u < userColors.length) || a >= autoColors.length) {
      palette.push(userColors[u++]);
    } else {
      palette.push(autoColors[a++]);
    }
  }
  // Remove accidental duplicates (rare, but possible)
  return Array.from(new Set(palette)).slice(0, totalColors);
}

// Calculate harmony score for a potential hue
function calculateHarmonyScore(hue, existingHues, strategy, index) {
  let score = 0;
  // Distance from existing hues (avoid too close)
  const minDistances = existingHues.map(existing => {
    let dist = Math.abs(hue - existing);
    return Math.min(dist, 360 - dist);
  });
  const minDistance = Math.min(...minDistances);
  // Base score from distance - increase weight for higher color counts
  const distanceWeight = existingHues.length >= 5 ? 1.5 : 0.5;
  score += minDistance * distanceWeight;
  // Strategy-specific scoring
  if (strategy === 'complementary') {
    // Prefer complementary relationships
    existingHues.forEach(existing => {
      const complement = (existing + 180) % 360;
      const distToComplement = Math.min(Math.abs(hue - complement), Math.abs(hue - complement + 360), Math.abs(hue - complement - 360));
      if (distToComplement < 30) score += 100;
    });
  } else if (strategy === 'analogous') {
    // Prefer colors close to existing ones
    if (minDistance < 60) score += 50;
  } else if (strategy === 'triadic') {
    // Prefer triadic relationships
    existingHues.forEach(existing => {
      const triadic1 = (existing + 120) % 360;
      const triadic2 = (existing + 240) % 360;
      const dist1 = Math.min(Math.abs(hue - triadic1), Math.abs(hue - triadic1 + 360), Math.abs(hue - triadic1 - 360));
      const dist2 = Math.min(Math.abs(hue - triadic2), Math.abs(hue - triadic2 + 360), Math.abs(hue - triadic2 - 360));
      if (dist1 < 30 || dist2 < 30) score += 80;
    });
  }
  // Bonus for even distribution - more important for higher color counts
  const idealSpacing = 360 / (existingHues.length + 1);
  const idealPosition = idealSpacing * (index + 1);
  const distFromIdeal = Math.min(Math.abs(hue - idealPosition), Math.abs(hue - idealPosition + 360), Math.abs(hue - idealPosition - 360));
  const distributionWeight = existingHues.length >= 5 ? 100 : 50;
  score += Math.max(0, distributionWeight - distFromIdeal);
  // Penalty for colors too close together (especially important for 6-7 colors)
  if (minDistance < 30) {
    score -= 200; // Heavy penalty for colors too close
  } else if (minDistance < 45) {
    score -= 100; // Medium penalty for colors somewhat close
  }
  return score;
}

// Generate CSS background properties for static mesh gradient export
export function generateCSSGradient(colors) {
  if (!colors || colors.length === 0) {
    return 'linear-gradient(45deg, #a259ff, #ff6b6b)';
  }

  if (colors.length === 1) {
    return `linear-gradient(45deg, ${colors[0]}, ${colors[0]})`;
  }

  if (colors.length === 2) {
    return `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`;
  }

  if (colors.length === 3) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
  }

  if (colors.length === 4) {
    return `linear-gradient(45deg, ${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 75%, ${colors[3]} 100%)`;
  }

  // For 5+ colors, create a more complex gradient
  const stops = colors.map((color, index) => {
    const percentage = (index / (colors.length - 1)) * 100;
    return `${color} ${percentage}%`;
  }).join(', ');

  return `linear-gradient(45deg, ${stops})`;
} 