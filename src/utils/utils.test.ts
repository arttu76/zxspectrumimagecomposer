import { safeZero } from "./utils";

describe('utils', () => {
    test('safe zero', () => {
        expect(safeZero(undefined)).toBe(0);
        expect(safeZero(0)).toBe(0);
        expect(safeZero(-1)).toBe(-1);
        expect(safeZero(7)).toBe(7);
    });
});
