import { GrowableGrid } from '../types';
import { getGrowableGridData, setGrowableGridData } from './growableGridManager';

describe('GrowableGridManager', () => {
    let grid: GrowableGrid<number>;

    beforeEach(() => {
        grid = {
            offsetX: 0,
            offsetY: 0,
            data: []
        };
    });

    test('set and get data', () => {
        grid = setGrowableGridData(grid, 0, 0, 5);
        expect(getGrowableGridData(grid, 0, 0)).toBe(5);
        expect(grid.data).toStrictEqual(
            [
                [5]
            ]
        );
    });

    test('grid grows correctly', () => {
        grid = setGrowableGridData(grid, 3, 2, 10);
        expect(getGrowableGridData(grid, 3, 2)).toBe(10);
        grid = setGrowableGridData(grid, -1, 4, 77);
        expect(getGrowableGridData(grid, 3, 2)).toBe(10);
        expect(getGrowableGridData(grid, -1, 4)).toBe(77);

        expect(grid).toStrictEqual({
            offsetX: -1,
            offsetY: 2,
            data: [
                [null, null, null, null, 10],
                [null, null, null, null, null],
                [77, null, null, null, null],
            ]
        });
    });

    test('grid shrinks correctly when setting to null', () => {
        grid = setGrowableGridData(grid, 2, 3, 10);
        grid = setGrowableGridData(grid, 2, 3, null);
        expect(getGrowableGridData(grid, 2, 3)).toBeNull();
        expect(grid.data).toStrictEqual(
            []
        );
    });

    test('offsets adjust correctly for negative coordinates', () => {
        grid = setGrowableGridData(grid, -4, -9, 15);
        expect(getGrowableGridData(grid, -4, -9)).toBe(15);
        expect(grid.offsetX).toBe(-4);
        expect(grid.offsetY).toBe(-9);
    });

    test('grid should shrink when setting non-edge data to null', () => {
        grid = setGrowableGridData(grid, 0, 0, 5);
        grid = setGrowableGridData(grid, 6, 10, 10);
        grid = setGrowableGridData(grid, 6, 10, null);
        expect(getGrowableGridData(grid, 0, 0)).toBe(5);
        expect(grid.data.length).toBe(1);
        expect(grid.data[0].length).toBe(1);
    });

    test('grid should work with negative coordinates', () => {
        grid = setGrowableGridData(grid, 1, 1, 5);
        expect(grid).toStrictEqual({
            offsetX: 1,
            offsetY: 1,
            data: [[5]]
        });

        grid = setGrowableGridData(grid, 6, 4, 10);
        expect(grid).toStrictEqual({
            offsetX: 1,
            offsetY: 1,
            data: [
                [5, null, null, null, null, null],
                [null, null, null, null, null, null],
                [null, null, null, null, null, null],
                [null, null, null, null, null, 10]
            ]
        });

        grid = setGrowableGridData(grid, -2, -1, 15);
        expect(grid).toStrictEqual({
            offsetX: -2,
            offsetY: -1,
            data: [
                [15, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null],
                [null, null, null, 5, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, 10]
            ]
        });

        grid = setGrowableGridData(grid, 6, 4, null);
        expect(grid).toStrictEqual({
            offsetX: -2,
            offsetY: -1,
            data: [
                [15, null, null, null],
                [null, null, null, null],
                [null, null, null, 5]
            ]
        });
    });


});
