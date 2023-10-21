import * as utils from './utils';

describe('utils', () => {
    test('safe zero and one', () => {
        expect(utils.safeZero(undefined)).toBe(0);
        expect(utils.safeZero(0)).toBe(0);
        expect(utils.safeOne(-1)).toBe(-1);
        expect(utils.safeZero(7)).toBe(7);

        expect(utils.safeOne(undefined)).toBe(1);
        expect(utils.safeOne(0)).toBe(1);
        expect(utils.safeOne(-1)).toBe(-1);
        expect(utils.safeOne(7)).toBe(7);
    });

});
