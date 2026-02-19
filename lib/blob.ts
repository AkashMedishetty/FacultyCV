import { put, del } from "@vercel/blob";

export async function uploadPhoto(
  doctorId: string,
  file: File
): Promise<string> {
  const blob = await put(`photos/${doctorId}/${file.name}`, file, {
    access: "public",
  });
  return blob.url;
}

export async function uploadCV(
  doctorId: string,
  file: File
): Promise<string> {
  const blob = await put(`cvs/${doctorId}/${file.name}`, file, {
    access: "public",
  });
  return blob.url;
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}
