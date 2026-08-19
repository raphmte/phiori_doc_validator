import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { lookup } from "mime-types";
import { TParsedFile } from "../plugins/multipart";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "aa-local";
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || "";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

function getR2PublicUrl(key: string): string {
  const publicDomain = R2_PUBLIC_DOMAIN.startsWith("http")
    ? R2_PUBLIC_DOMAIN
    : `https://${R2_PUBLIC_DOMAIN}`;
  return `${publicDomain.replace(/\/+$/, "")}/${key}`;
}

async function uploadDocValidationFile(
  file: TParsedFile,
  claCode: string,
  validationId: string,
  suffix?: string
): Promise<{ key: string; fileUrl: string }> {
  const mimeType = file.mimetype || lookup(file.filename) || "application/octet-stream";
  const ext = file.filename.split(".").pop();
  const dateFolder = new Date().toISOString().slice(0, 10);
  const key = `${claCode}/${dateFolder}/${validationId}${suffix ? `-${suffix}` : ""}${ext ? `.${ext}` : ""}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: mimeType,
    })
  );

  return { key, fileUrl: getR2PublicUrl(key) };
}

async function getFileBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
  );

  return Buffer.from(await res.Body!.transformToByteArray());
}

export default {
  uploadDocValidationFile,
  getFileBuffer,
};
