import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ENDPOINT = process.env.KT_CLOUD_ENDPOINT || 'https://obj-e-1.ktcloud.com';
const ACCESS_KEY = process.env.KT_CLOUD_ACCESS_KEY || '';
const SECRET_KEY = process.env.KT_CLOUD_SECRET_KEY || '';
export const BUCKET = process.env.KT_CLOUD_BUCKET || 'teampl';
const REGION = process.env.KT_CLOUD_REGION || 'kr-standard';

export const s3Client = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true, // KT Cloud는 path-style 사용
});

/**
 * 파일을 KT Cloud 오브젝트 스토리지에 업로드합니다.
 * @param key 저장될 오브젝트 키 (예: "projects/1/파일명.pdf")
 * @param buffer 파일 버퍼
 * @param contentType MIME 타입
 * @returns 공개 접근 URL
 */
export async function uploadToKTCloud(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // 퍼블릭 읽기 허용 (버킷 정책에 따라 생략 가능)
    ACL: 'public-read' as any,
  });

  await s3Client.send(command);

  // KT Cloud 오브젝트 공개 URL (path-style)
  return `${ENDPOINT}/${BUCKET}/${key}`;
}

/**
 * KT Cloud 오브젝트 스토리지에서 파일을 삭제합니다.
 * @param key 오브젝트 키
 */
export async function deleteFromKTCloud(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * 다운로드용 임시 서명 URL을 생성합니다 (1시간 유효).
 * @param key 오브젝트 키
 */
export async function getPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
