export type DetectedColor = "red" | "green" | "white";

class ColorDetectionService {
  private myTeamColor: string | null = null;

  // Set the team color from PlayerView
  setMyTeamColor(color: string) {
    this.myTeamColor = color.toLowerCase();
  }

  detectColor(video: HTMLVideoElement, canvas: HTMLCanvasElement): DetectedColor {
    const ctx = canvas.getContext("2d");
    if (!ctx) return "white";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Center sample
    const size = 10;
    const x = Math.floor(canvas.width / 2 - size / 2);
    const y = Math.floor(canvas.height / 2 - size / 2);
    const imageData = ctx.getImageData(x, y, size, size);

    let r = 0, g = 0, b = 0;
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
    }

    const pixelCount = pixels.length / 4;
    r /= pixelCount;
    g /= pixelCount;
    b /= pixelCount;

    // Determine dominant color
    const threshold = 100;
    let detected: string = "none";

    if (r > threshold && r > g * 1.2 && r > b * 1.2) detected = "red";
    else if (g > threshold && g > r * 1.2 && g > b * 1.2) detected = "green";
    else if (b > threshold && b > r * 1.2 && b > g * 1.2) detected = "blue";

    // Compare with my team color
    if (detected === "none") return "white";
    if (detected === this.myTeamColor) return "red"; // friendly
    return "green"; // enemy
  }
}

export default new ColorDetectionService();
