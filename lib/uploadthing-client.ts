'use client';

import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from './uploadthing';

export const { uploadFiles } = generateReactHelpers<OurFileRouter>();
