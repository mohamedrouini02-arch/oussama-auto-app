import { useMemo } from 'react';

export function c(size) {
    return useMemo(() => new Array(size), [size]);
}
