// src/server/storage/s3.ts
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "@/lib/env";

const credentials =
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

export const s3 = new S3Client({
  region: env.AWS_REGION ?? "us-east-1",
  credentials,
});

export async function putObjectStream({
  bucket,
  key,
  body,
  contentType,
  cacheControl,
}: {
  bucket: string;
  key: string;
  body: NodeJS.ReadableStream;
  contentType: string;
  cacheControl?: string;
}) {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl ?? "public, max-age=31536000, immutable",
    },
  });
  await upload.done();
  const base = env.CLOUDFRONT_BASE_URL.replace(/\/+$/, "");
  return `${base}/${key}`.replace(/(?<!:)\/{2,}/g, "/");
}
