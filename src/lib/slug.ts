import { customAlphabet } from "nanoid";

const slugAlphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const generateSlugPart = customAlphabet(slugAlphabet, 12);

export function generateSecureSlug(): string {
  return generateSlugPart();
}

export function generateFolderName(): string {
  return `evt_${customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16)()}`;
}
