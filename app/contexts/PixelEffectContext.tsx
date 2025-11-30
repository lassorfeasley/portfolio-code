'use client';

import { createContext, useContext } from 'react';

/**
 * Context to signal whether the pixel effect should be enabled.
 * RetroWindow components provide `true`, allowing child images to know
 * they should apply the pixelation effect without runtime DOM queries.
 */
const PixelEffectContext = createContext<boolean>(false);

export function usePixelEffectEnabled(): boolean {
  return useContext(PixelEffectContext);
}

export default PixelEffectContext;

