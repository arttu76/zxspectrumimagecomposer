import { GrowableGrid } from "../types";

export const getPixel = <T>(grid: GrowableGrid<T>, x: number, y: number): T | undefined => {
    if (y - grid.offsetY > grid.pixels.length - 1) {
        return undefined;
    }

    const row = grid.pixels[y - grid.offsetY];
    return x < row.length
        ? row[x - grid.offsetX]
        : undefined;
}

