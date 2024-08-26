import { generateReactHelpers } from '@uploadthing/react';

import type { OurFileRouter } from '@/lib/service/uploadthing';

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
