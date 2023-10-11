import * as R from "ramda";
import { GrowableGrid, Nullable } from "../types";

const getExistingRowSize = <T>(grid: GrowableGrid<T>): number => grid.data[0]?.length || 0;

const growIfRequired = <T>(grid: GrowableGrid<T>, x: number, y: number): GrowableGrid<T> => {

    const newGrid = R.clone(grid);
    const existingRowSize = getExistingRowSize(grid);

    // grow up
    if (y < newGrid.offsetY) {
        for (let i = 0; i < newGrid.offsetY - y; i++) {
            newGrid.data.unshift(
                Array(existingRowSize).fill(null)
            );
        }
        newGrid.offsetY = y;
    }

    // grow down
    if (newGrid.data[y - newGrid.offsetY] === undefined) {
        const missingRows = y - newGrid.offsetY - newGrid.data.length + 1;
        for (let i = 0; i < missingRows; i++) {
            newGrid.data.push(
                Array(existingRowSize).fill(null)
            );
        }
    }

    // grow left
    if (x < newGrid.offsetX) {
        newGrid.data = newGrid.data.map(row => [
            ...Array(newGrid.offsetX - x).fill(null),
            ...row
        ]);
        newGrid.offsetX = x;
    }

    // grow right
    const needToAddToRight = x - newGrid.offsetX - getExistingRowSize(newGrid) + 1;
    if (needToAddToRight > 0) {

        newGrid.data = newGrid.data.map(row => [
            ...row,
            ...Array(needToAddToRight).fill(null)
        ] as Nullable<T>[]);
    }

    return newGrid;
};

const shrinkGridIfPossible = <T>(grid: GrowableGrid<T>): GrowableGrid<T> => {
    let newGrid = R.clone(grid);

    // shrink topmost row
    while (
        newGrid.data.length > 0
        && newGrid.data[0].every(cell => cell === null)
    ) {
        newGrid.data.shift();
        newGrid.offsetY += 1;
    }

    // shrink leftmost column
    while (
        newGrid.data.length > 0
        && newGrid.data.every(row => row[0] === null)
    ) {
        newGrid.data.forEach(row => row.shift());
        newGrid.offsetX += 1;
    }

    // purge data from right making it smaller
    while (
        newGrid.data.length > 0
        && newGrid.data.every(row => row[row.length - 1] === null)
    ) {
        newGrid.data.forEach(row => row.pop());
    }

    // shrink bottom row
    while (
        newGrid.data.length > 0
        && newGrid.data[newGrid.data.length - 1].every(cell => cell === null)
    ) {
        newGrid.data.pop();
    }

    return newGrid;
};

export const setGridData = <T>(grid: GrowableGrid<T>, x: number, y: number, value: Nullable<T>): GrowableGrid<T> => {
    if (grid.data.length === 0) {
        return {
            offsetX: x,
            offsetY: y,
            data: [[value]]
        };
    }

    if (value !== null) {
        const newGrid = growIfRequired(grid, x, y);
        newGrid.data[y - newGrid.offsetY][x - newGrid.offsetX] = value;
        return newGrid
    } else {
        grid.data[y - grid.offsetY][x - grid.offsetX] = null;
        return shrinkGridIfPossible(grid);
    }
};

export const getGridData = <T>(grid: GrowableGrid<T>, x: number, y: number): Nullable<T> => {
    const existingSize = getExistingRowSize(grid);
    return (
        x < grid.offsetX
        || x >= (grid.offsetX + existingSize)
        || y < grid.offsetY
        || y >= grid.offsetY + grid.data.length
    )
        ? null
        : grid.data[y - grid.offsetY][x - grid.offsetX];
};
