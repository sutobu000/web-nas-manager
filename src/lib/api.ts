"use client";

import type { DirectoryListing, StorageDrive } from "@/types/files";

/**
 * Fetch the configured storage drives from the API.
 */
export async function getDrives(): Promise<StorageDrive[]> {
  const res = await fetch("/api/drives");
  if (!res.ok) return [];
  return res.json() as Promise<StorageDrive[]>;
}

/**
 * Fetch directory listing from the API.
 */
export async function fetchFiles(path: string): Promise<DirectoryListing> {
  const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to load files");
  }
  return res.json();
}

/**
 * Upload a file to the specified directory.
 */
export async function uploadFile(
  file: File,
  targetPath: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; name: string; size: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files/upload");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.message || "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", targetPath);
    xhr.send(formData);
  });
}

/**
 * Create a new folder.
 */
export async function createFolder(
  targetPath: string,
  name: string
): Promise<{ success: boolean; path: string }> {
  const res = await fetch("/api/files/mkdir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: targetPath, name }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to create folder");
  }
  return res.json();
}

/**
 * Rename a file or folder.
 */
export async function renameItem(
  path: string,
  newName: string
): Promise<{ success: boolean }> {
  const res = await fetch("/api/files/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, newName }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to rename");
  }
  return res.json();
}

/**
 * Delete a file or folder.
 */
export async function deleteItem(
  path: string
): Promise<{ success: boolean }> {
  const res = await fetch("/api/files", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete");
  }
  return res.json();
}

/**
 * Get download URL for a file.
 */
export function getDownloadUrl(path: string): string {
  return `/api/files/download?path=${encodeURIComponent(path)}`;
}

/**
 * Toggle favorite status for a file.
 */
export async function toggleFavorite(
  path: string,
  favorite: boolean
): Promise<void> {
  const res = await fetch("/api/files/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, favorite }),
  });
  if (!res.ok) throw new Error("Failed to update favorite");
}

/**
 * Update tags for a file.
 */
export async function updateTags(
  path: string,
  tags: string[]
): Promise<void> {
  const res = await fetch("/api/files/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, tags }),
  });
  if (!res.ok) throw new Error("Failed to update tags");
}

/**
 * Get tags/favorite data for a file.
 */
export async function getFileTags(
  path: string
): Promise<{ favorite?: boolean; tags?: string[] }> {
  const res = await fetch(`/api/files/tags?path=${encodeURIComponent(path)}`);
  if (!res.ok) return {};
  return res.json();
}

/**
 * Get all tags.
 */
export async function getAllTags(): Promise<string[]> {
  const res = await fetch("/api/files/tags?list=true");
  if (!res.ok) return [];
  const data = await res.json();
  return data.tags;
}
