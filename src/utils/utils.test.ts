import * as utils from './utils';

describe('utils', () => {
    test('safe zero', () => {
        expect(utils.safeZero(undefined)).toBe(0);
        expect(utils.safeZero(0)).toBe(0);
        expect(utils.safeZero(-1)).toBe(-1);
        expect(utils.safeZero(7)).toBe(7);
    });


    test('pack 8 bit', () => {
        expect(utils.pack8bit([
            128,
            255,
            0,
            64,
            23,
            1,
            2,
            3,
            4
        ])).toBe('foo');
    });

});
