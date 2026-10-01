"""Hậu xử lý ảnh do Codex sinh ra.

  python3 scripts/postprocess.py <mode> <src.png> <out_dir> <name>

mode:
  photo        ảnh thường -> <name>.webp (rộng tối đa 1600px)
  white        tách nền trắng thành trong suốt -> <name>.webp (có alpha)
  black        tách nền đen thành trong suốt -> <name>.webp (có alpha)
  cutout       tách vật thể (cúp, ảnh 3D) khỏi nền trắng, giữ điểm sáng bên trong
  key-orange   tách người khỏi phông cam trơn
  pair         ảnh ghép 2 chân dung trái/phải -> <name>-1.webp, <name>-2.webp
  grid:CxR:bg  lưới icon C cột x R hàng trên nền bg (white|black) -> <name>-1..N.webp
"""

import sys

import numpy as np
from PIL import Image


def save(img: Image.Image, path: str, max_w: int = 1600) -> None:
    if img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)), Image.LANCZOS)
    img.save(path, "WEBP", quality=82, method=6)


def unmix(arr: np.ndarray, bg: str) -> np.ndarray:
    """Color-to-alpha: coi nền trắng/đen là trong suốt, giữ màu thật của phần còn lại."""
    rgb = arr[..., :3].astype(float)
    if bg == "white":
        dist = (255 - rgb).max(-1)
        alpha = np.clip((dist - 6) / 249, 0, 1)
        safe = np.maximum(alpha, 1e-3)[..., None]
        color = 255 - (255 - rgb) / safe
    else:
        dist = rgb.max(-1)
        alpha = np.clip((dist - 8) / 247, 0, 1)
        safe = np.maximum(alpha, 1e-3)[..., None]
        color = rgb / safe
    color = np.clip(color, 0, 255)
    return np.dstack([color, alpha * 255]).astype("uint8")


def cutout(arr: np.ndarray) -> np.ndarray:
    """Tách vật thể khỏi nền trắng: chỉ vùng trắng nối liền mép ảnh mới trong suốt (giữ điểm sáng bên trong)."""
    from scipy import ndimage

    rgb = arr[..., :3].astype(float)
    whiteish = rgb.min(-1) > 232
    labels, _ = ndimage.label(whiteish)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border[border > 0])
    # Viền mềm: alpha tăng dần theo khoảng cách tới vùng nền
    dist = ndimage.distance_transform_edt(~bg)
    alpha = np.clip(dist / 3, 0, 1)
    # Bóng đổ nhạt sát nền: giữ một phần theo độ đậm
    soft = np.clip((255 - rgb.min(-1)) / 60, 0, 1)
    alpha = np.where(bg, soft * 0.6, alpha)
    return np.dstack([rgb, alpha * 255]).astype("uint8")


def key_orange(arr: np.ndarray) -> np.ndarray:
    """Tách người khỏi phông cam trơn: vùng cam sáng, bão hoà, nối liền mép trên/trái/phải thành trong suốt."""
    from scipy import ndimage

    rgb = arr[..., :3].astype(float) / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    orange = (r > 0.8) & (sat > 0.55) & (g < r * 0.85) & (b < 0.45)
    labels, _ = ndimage.label(orange)
    edge = np.unique(np.concatenate([labels[0], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, edge[edge > 0])
    bg = ndimage.binary_opening(bg, iterations=2)
    dist = ndimage.distance_transform_edt(~bg)
    alpha = np.clip(dist / 2.5, 0, 1)
    return np.dstack([arr[..., :3], alpha * 255]).astype("uint8")


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
    box = img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not box:
        return img
    l, t, r, b = box
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


def crop_band(path: str, keep_solid: int = 24) -> None:
    """Cắt ảnh dải sóng (có alpha) về đúng vùng chuyển tiếp: bỏ bớt phần trắng đặc và phần trong suốt hoàn toàn."""
    img = Image.open(path).convert("RGBA")
    a = np.array(img)[..., 3].astype(float) / 255
    rows = a.mean(1)
    mixed = np.where((rows > 0.02) & (rows < 0.985))[0]
    if not len(mixed):
        return
    top, bottom = mixed[0], mixed[-1]
    solid_above = rows[:top].mean() > 0.5 if top else False
    solid_below = rows[bottom + 1 :].mean() > 0.5 if bottom + 1 < len(rows) else False
    top = max(0, top - (keep_solid if solid_above else 0))
    bottom = min(img.height, bottom + 1 + (keep_solid if solid_below else 0))
    band = np.array(img.crop((0, top, img.width, bottom))).astype(float)
    # Làm mờ dần phía mép trong suốt để không lộ đường cắt thẳng
    h = band.shape[0]
    fade = max(1, int(h * 0.3))
    ramp = np.linspace(0, 1, fade) ** 1.5
    if not solid_above:
        band[:fade, :, 3] *= ramp[:, None]
    if not solid_below:
        band[h - fade :, :, 3] *= ramp[::-1][:, None]
    Image.fromarray(band.astype("uint8"), "RGBA").save(path, "WEBP", quality=85, method=6)


def main() -> None:
    mode, src, out, name = sys.argv[1:5]
    im = Image.open(src).convert("RGB")
    arr = np.array(im)

    if mode == "photo":
        save(im, f"{out}/{name}.webp")
    elif mode == "key-orange":
        save(Image.fromarray(key_orange(arr), "RGBA"), f"{out}/{name}.webp")
    elif mode == "cutout":
        save(trim(Image.fromarray(cutout(arr), "RGBA"), pad=4), f"{out}/{name}.webp")
    elif mode in ("white", "black"):
        save(Image.fromarray(unmix(arr, mode), "RGBA"), f"{out}/{name}.webp")
        if name.startswith("wave-"):
            crop_band(f"{out}/{name}.webp")
    elif mode == "pair":
        w, h = im.size
        for k, box in enumerate([(0, 0, w // 2, h), (w // 2, 0, w, h)], start=1):
            save(im.crop(box), f"{out}/{name}-{k}.webp", max_w=640)
    elif mode.startswith("grid:"):
        _, size, bg = mode.split(":")
        cols, rows = map(int, size.split("x"))
        rgba = unmix(arr, bg)
        # Tách theo từng khối vật thể (gộp các mảnh gần nhau), lấy N khối lớn nhất rồi xếp theo hàng/cột
        from scipy import ndimage

        mask = ndimage.binary_dilation(rgba[..., 3] > 40, iterations=12)
        labels, count = ndimage.label(mask)
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        keep = sorted(np.argsort(sizes)[::-1][: cols * rows] + 1)
        boxes = [ndimage.find_objects((labels == k).astype(int))[0] for k in keep]
        cell_h = rgba.shape[0] / rows
        boxes.sort(key=lambda b: (int(((b[0].start + b[0].stop) / 2) // cell_h), b[1].start))
        for n, (ys, xs) in enumerate(boxes, start=1):
            piece = rgba.copy()
            piece[..., 3] = np.where(labels == keep[[ndimage.find_objects((labels == k).astype(int))[0] for k in keep].index((ys, xs))], piece[..., 3], 0)
            cell = trim(Image.fromarray(piece[ys, xs], "RGBA"))
            cell.thumbnail((256, 256), Image.LANCZOS)
            cell.save(f"{out}/{name}-{n}.webp", "WEBP", quality=88, method=6)
    else:
        raise SystemExit(f"mode không hợp lệ: {mode}")


if __name__ == "__main__":
    main()

