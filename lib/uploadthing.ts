import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  orderFiles: f({
    image: { maxFileSize: '64MB', maxFileCount: 20 },
    blob: { maxFileSize: '64MB', maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    // File is now stored on UploadThing CDN — return metadata to client
    return { url: file.url, name: file.name, size: file.size };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
