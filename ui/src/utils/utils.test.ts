import { Layer } from '../types';
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

    test('aspect ratio', () => {

        expect(utils.getOriginalAspectRatio({
            originalWidth: 16,
            originalHeight: 9
        } as Layer)).toBe(16 / 9);

        expect(utils.getOriginalAspectRatio({
            originalWidth: 0,
            originalHeight: 0
        } as Layer)).toBe(0);

        expect(utils.getOriginalAspectRatio({
            originalWidth: 0,
            originalHeight: 0
        } as Layer)).toBe(0);

        expect(utils.getWidthForAspectRatio({
            originalWidth: 16,
            originalHeight: 9,
            height: 18
        } as Layer)).toBe(32);

        expect(utils.getHeightForAspectRatio({
            originalWidth: 16,
            originalHeight: 9,
            width: 32
        } as Layer)).toBe(18);

    });

});
