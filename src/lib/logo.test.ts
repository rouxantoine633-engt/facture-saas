import { describe, expect, it } from "vitest";
import { inspectLogo, MAX_LOGO_BYTES } from "./logo";

const bytes = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));

const PNG_RGBA = "iVBORw0KGgoAAAANSUhEUgAAACgAAAAUCAYAAAD/Rn+7AAAAPklEQVR4nM3OQQEAEADAwFkQWTRWQywRPO0S3JhrH8IkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuIkTuL8HXi5DuUB/eSvaYAAAAAASUVORK5CYII=";
const PNG_INTERLACED = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAAE8ahlKAAAAFElEQVR4nGNkZGJmwAaYsIoOWgkAC6oAFkhUOOcAAAAASUVORK5CYII=";
const JPEG_RGB = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAMAB4DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDgqKKK8M/VAooooA//2Q==";
const JPEG_CMYK = "/9j/7gAOQWRvYmUAZAAAAAAA/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/8AAFAgACgAKBEMRAE0RAFkRAEsRAP/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/aAA4EQwBNAFkASwAAPwD3+vf69/r3+iiiiiiiiiiiiv/Z";

describe("inspectLogo", () => {
  it("reconnaît un PNG et ses dimensions", () => {
    expect(inspectLogo(bytes(PNG_RGBA))).toEqual({ ok: true, format: "png", mimeType: "image/png", width: 40, height: 20 });
  });

  it("reconnaît un JPEG RVB et ses dimensions", () => {
    expect(inspectLogo(bytes(JPEG_RGB))).toEqual({ ok: true, format: "jpg", mimeType: "image/jpeg", width: 30, height: 12 });
  });

  it("refuse un PNG entrelacé et un JPEG CMJN (non pris en charge par le moteur PDF)", () => {
    const png = inspectLogo(bytes(PNG_INTERLACED));
    expect(png.ok).toBe(false);
    const jpeg = inspectLogo(bytes(JPEG_CMYK));
    expect(jpeg.ok).toBe(false);
    if (!jpeg.ok) expect(jpeg.error).toContain("CMJN");
  });

  it("se fie à la signature des octets, pas à l'extension ni au type annoncé", () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const r = inspectLogo(svg);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("PNG ou JPEG");
    expect(inspectLogo(new TextEncoder().encode("GIF89a....")).ok).toBe(false);
  });

  it("refuse un fichier vide, trop lourd ou tronqué", () => {
    expect(inspectLogo(new Uint8Array()).ok).toBe(false);
    const tooBig = new Uint8Array(MAX_LOGO_BYTES + 1);
    tooBig.set([0x89, 0x50, 0x4e, 0x47]);
    const big = inspectLogo(tooBig);
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.error).toContain("trop lourd");
    expect(inspectLogo(bytes(PNG_RGBA).slice(0, 20)).ok).toBe(false);
    expect(inspectLogo(bytes(JPEG_RGB).slice(0, 30)).ok).toBe(false);
  });
});
