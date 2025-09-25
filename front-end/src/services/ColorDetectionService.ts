//Welcome Galane:2024671386
//Phiwokwakhe Khathwane: 2022004325

//Possible colors
export type DetectedColor =
  | "red"
  | "green"
  | "white"
  | "yellow"
  | "blue"
  | "orange"
  | "purple";

  //HSV color values
interface HSV {
  h: number;
  s: number;
  v: number;
}

//HSV ranges 
const COLOR_RANGES: Record<string, [number[], number[]][]> = {
  red: [
    [[0, 100, 100], [10, 255, 255]],
    [[170, 100, 100], [179, 255, 255]], 
  ],
  blue: [[[100, 150, 50], [130, 255, 255]]],
  green: [[[40, 70, 70], [80, 255, 255]]],
  yellow: [[[20, 100, 100], [30, 255, 255]]],
  orange: [[[10, 100, 100], [20, 255, 255]]],
  purple: [[[130, 100, 100], [160, 255, 255]]],
};

//Color detection service class
class ColorDetectionService {
  //The player's and enemy's team color fields
  private myTeamColor: string | null = null;
  private enemyTeamColor: string | null = null;

  //Set the team colors fields
  setTeamColors(myColor: string, enemyColor: string) {
    this.myTeamColor = myColor.toLowerCase();
    this.enemyTeamColor = enemyColor.toLowerCase();
  }

  //Convert rgb values to hsv
  private rgbToHsv(r: number, g: number, b: number): HSV {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;

    if (d !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / d + 2) * 60;
          break;
        case b:
          h = ((r - g) / d + 4) * 60;
          break;
      }
    }

    // normalize to OpenCV style ranges
    h = Math.round(h / 2);        // 0–179
    const s = Math.round((max === 0 ? 0 : d / max) * 255);
    const v = Math.round(max * 255);

    return { h, s, v };
  }

  //Classify the colors
  private classifyColor(r: number, g: number, b: number): string | null {
    const hsv = this.rgbToHsv(r, g, b);

    for (const [color, ranges] of Object.entries(COLOR_RANGES)) {
      for (const [lower, upper] of ranges) {
        if (
          hsv.h >= lower[0] &&
          hsv.h <= upper[0] &&
          hsv.s >= lower[1] &&
          hsv.s <= upper[1] &&
          hsv.v >= lower[2] &&
          hsv.v <= upper[2]
        ) {
          return color;
        }
      }
    }
    return null;
  }

  //Classify the most frequent color in a region
  private classifyRegion(pixels: Uint8ClampedArray): string | null {
    const counts: Record<string, number> = {};

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const color = this.classifyColor(r, g, b);
      if (color) counts[color] = (counts[color] || 0) + 1;
    }

    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }

  //Determine the color in the center of the frame
  detectColor(video: HTMLVideoElement, canvas: HTMLCanvasElement): DetectedColor {
    const ctx = canvas.getContext("2d");
    //Return white if no canvas context is available
    if (!ctx) return "white";

    //Match the canvas dimensions to the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    //Define a small sampling area in the center
    const size = 10;
    const x = Math.floor(canvas.width / 2 - size / 2);
    const y = Math.floor(canvas.height / 2 - size / 2);
    const imageData = ctx.getImageData(x, y, size, size);

    //Calculate the rgb values from pixels in the sampling area
    const detected = this.classifyRegion(imageData.data);

    //Determine the color to return
    //White: No enemy or team color detected
    //Green: Team color detected
    //Red: Enemy color detected
    if (!detected) return "white";
    if (detected === this.myTeamColor) return "green"; // team
    if (detected === this.enemyTeamColor) return "red"; // enemy

    //Return white by default
    return "white"; 
  }

  //Getters for enemy and team color
  getEnemyTeamColor(): string | null {
    return this.enemyTeamColor;
  }

  getMyTeamColor(): string | null {
    return this.myTeamColor;
  }
}

export default new ColorDetectionService();
