// ---------------------------------------------------------------------------
// galleryService – all Firestore / Storage operations for the Gallery feature
// ---------------------------------------------------------------------------

import {
  collection,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../firebase';
import type { GalleryItem, SingleGalleryItem, InviteGalleryItem, GalleryInvite } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a base-64 data-URL (e.g. from `canvas.toDataURL()`) to a Blob. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Compress a data-URL image to below 2 MB before storing it in Firestore.
 * Progressively lowers JPEG quality until the result fits.
 */
export async function uploadPhoto(dataUrl: string): Promise<string> {
  // Estimate byte size of the base64 payload
  const base64 = dataUrl.split(',')[1] ?? '';
  const estimatedBytes = Math.ceil((base64.length * 3) / 4);

  if (estimatedBytes <= MAX_BYTES) {
    return dataUrl; // Already small enough
  }

  // Compress using an offscreen canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Optionally down-scale very large images (keep aspect ratio, max 1280 px wide)
      const MAX_DIM = 1280;
      let { width, height } = img;
      if (width > MAX_DIM) {
        height = Math.round((height / width) * MAX_DIM);
        width = MAX_DIM;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not available')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality until under 2 MB
      let quality = 0.85;
      let result = canvas.toDataURL('image/jpeg', quality);

      while (quality > 0.2) {
        const b64 = result.split(',')[1] ?? '';
        const bytes = Math.ceil((b64.length * 3) / 4);
        if (bytes <= MAX_BYTES) break;
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

// ── Gallery items ────────────────────────────────────────────────────────────

const galleryCol = () => collection(db, 'gallery_items');

/** Write a new gallery item (single or invite) to Firestore. */
export async function addGalleryItem(
  item:
    | Omit<SingleGalleryItem, 'id' | 'createdAt'>
    | Omit<InviteGalleryItem, 'id' | 'createdAt'>,
): Promise<string> {
  const docRef = await addDoc(galleryCol(), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Subscribe to the gallery collection in real-time.
 * Returns an unsubscribe function.
 */
export function subscribeToGallery(
  callback: (items: GalleryItem[]) => void,
): () => void {
  const q = query(galleryCol(), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: GalleryItem[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        // Firestore serverTimestamp() is null on the local write before the
        // server round-trip, so fall back to Date.now().
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : Date.now(),
      } as GalleryItem;
    });
    callback(items);
  });
}

// ── Invites ──────────────────────────────────────────────────────────────────

const invitesCol = () => collection(db, 'gallery_invites');

/** Create an invite and return its document ID. */
export async function createInvite(
  inviterData: GalleryInvite['inviter'],
): Promise<string> {
  const docRef = await addDoc(invitesCol(), {
    inviter: inviterData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Fetch a pending invite by ID. Returns null if not found. */
export async function getInvite(
  inviteId: string,
): Promise<GalleryInvite | null> {
  const snap = await getDoc(doc(db, 'gallery_invites', inviteId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    inviter: data.inviter,
  } as GalleryInvite;
}

/** Delete a consumed invite. */
export async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, 'gallery_invites', inviteId));
}
