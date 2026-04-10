import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  orderFiles: f({
    image: { maxFileSize: '64MB', maxFileCount: 20 },
    blob: { maxFileSize: '64MB', maxFileCount: 20 },
  })
    .onUploadComplete(({ file }) => {
      console.log('[uploadthing] upload complete:', file.name, file.ufsUrl);
      return { url: file.ufsUrl, name: file.name, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
