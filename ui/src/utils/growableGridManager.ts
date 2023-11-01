import { Grid, GrowableGrid, Nullable } from "../types";

const getExistingRowSize = <T>(grid: GrowableGrid<T>): number => grid?.data[0]?.length || 0;

const cloneGrid = <T>(grid: GrowableGrid<T>) => JSON.parse(JSON.stringify(grid)) as GrowableGrid<T>;

const growIfRequired = <T>(grid: GrowableGrid<T>, x: number, y: number): GrowableGrid<T> => {

    const newGrid = cloneGrid(grid);
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
    let newGrid = cloneGrid(grid);

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
        grid.data[y - grid.offsetY][x - grid.offsetX] = null;
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
    return {
        ...grid,
        offsetX: grid.offsetX + x,
        offsetY: grid.offsetY + y
    };
}
