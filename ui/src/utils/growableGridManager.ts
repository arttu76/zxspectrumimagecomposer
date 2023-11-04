import { Grid, GrowableGrid, Nullable } from "../types";

const getExistingRowSize = <T>(grid: GrowableGrid<T>): number => grid?.data[0]?.length || 0;

const growIfRequired = <T>(grid: GrowableGrid<T>, x: number, y: number): GrowableGrid<T> => {

    const existingRowSize = getExistingRowSize(grid);

    // grow up
    if (y < grid.offsetY) {
        for (let i = 0; i < grid.offsetY - y; i++) {
            grid.data.unshift(Array(existingRowSize).fill(null));
        }
        grid.offsetY = y;
    }

    // grow down
    if (grid.data[y - grid.offsetY] === undefined) {
        const missingRows = y - grid.offsetY - grid.data.length + 1;
        for (let i = 0; i < missingRows; i++) {
            grid.data.push(Array(existingRowSize).fill(null));
        }
    }

    // grow left
    if (x < grid.offsetX) {
        grid.data = grid.data.map(row => [
            ...Array(grid.offsetX - x).fill(null),
            ...row
        ]);
        grid.offsetX = x;
    }

    // grow right
    const needToAddToRight = x - grid.offsetX - getExistingRowSize(grid) + 1;
    if (needToAddToRight > 0) {
        for (let i = 0; i < grid.data.length; i++) {
            grid.data[i] = [...grid.data[i], ...Array(needToAddToRight).fill(null)];
        }
    }

    return grid;
};

const shrinkGridIfPossible = <T>(grid: GrowableGrid<T>): GrowableGrid<T> => {
    // shrink topmost row
    while (
        grid.data.length > 0
        && grid.data[0].every(cell => cell === null)
    ) {
        grid.data.shift();
        grid.offsetY += 1;
    }

    // shrink leftmost column
    while (
        grid.data.length > 0
        && grid.data.every(row => row[0] === null)
    ) {
        grid.data.forEach(row => row.shift());
        grid.offsetX += 1;
    }

    // purge data from right making it smaller
    while (
        grid.data.length > 0
        && grid.data.every(row => row[row.length - 1] === null)
    ) {
        grid.data.forEach(row => row.pop());
    }

    // shrink bottom row
    while (
        grid.data.length > 0
        && grid.data[grid.data.length - 1].every(cell => cell === null)
    ) {
        grid.data.pop();
    }

    return grid;
};



export const getEmptyGrowableGrid = <T>(data?: Grid<Nullable<T>>): GrowableGrid<T> => {
    return {
        offsetX: 0,
        offsetY: 0,
        data: data || []
    };
}

export const setAllGrowableGridData = <T>(grid: GrowableGrid<T>, adjustmentFunc: ((value: Nullable<T>) => Nullable<T>)): GrowableGrid<T> => {
    return {
        ...grid,
        data: grid.data.map(row => row.map(adjustmentFunc))
    }
}

export const setGrowableGridData = <T>(grid: GrowableGrid<T>, x: number, y: number, value: Nullable<T>): GrowableGrid<T> => {
    if (!grid?.data?.length) {
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
        if (
            grid.data
            && (y - grid.offsetY) < grid.data.length
            && grid.data[y - grid.offsetY]
            && (x - grid.offsetX) < grid.data[y - grid.offsetY].length
        ) {
            grid.data[y - grid.offsetY][x - grid.offsetX] = null;
        }
        return shrinkGridIfPossible(grid);
    }

};

export const getGrowableGridData = <T>(grid: GrowableGrid<T>, x: number, y: number): Nullable<T> => {
    const existingSize = getExistingRowSize(grid);
    return (
        existingSize === 0
        || x < grid.offsetX
        || x >= (grid.offsetX + existingSize)
        || y < grid.offsetY
        || y >= grid.offsetY + grid.data.length
    )
        ? null
        : grid.data[y - grid.offsetY][x - grid.offsetX];
};

export const scrollGrowableGrid = <T>(grid: GrowableGrid<T>, x: number, y: number): GrowableGrid<T> => {
    grid.offsetX += x;
    grid.offsetY += y;
    return grid;
}
