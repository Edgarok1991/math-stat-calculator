'use client';

import { ReactNode } from 'react';

interface MobXProviderProps {
  children: ReactNode;
}

export function MobXProvider({ children }: MobXProviderProps) {
  return <>{children}</>;
}
