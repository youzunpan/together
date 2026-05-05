// AES-256-GCM 對稱加密。用於把申請者填的密碼加密存 DB，
// 通過審核時才解密並丟給 Supabase 雜湊建立帳號，存放期間不會有明文。
//
// Key：APPLICATION_SECRET_KEY（base64 編碼的 32 bytes）
// 產生方式：
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
//
// 輸出格式：base64( iv(12) || tag(16) || ciphertext(N) )

import "server-only";
import crypto from "node:crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const b64 = process.env.APPLICATION_SECRET_KEY;
  if (!b64) throw new Error("APPLICATION_SECRET_KEY is not set");
  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) {
    throw new Error("APPLICATION_SECRET_KEY must decode to exactly 32 bytes");
  }
  return buf;
}

export function encryptText(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptText(b64: string): string {
  const buf = Buffer.from(b64, "base64");
  if (buf.length < 28) throw new Error("ciphertext too short");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
