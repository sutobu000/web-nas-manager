/**
 * Represents a single file or directory entry.
 */
export interface FileInfo {
  name: string;
  type: "file" | "directory";
  size: number;
  modified: string;
  extension: string;
  isImage: boolean;
  isVideo: boolean;
  thumbnailUrl?: string;
}

/**
 * Represents a breadcrumb navigation item.
 */
export interface Breadcrumb {
  name: string;
  path: string;
}

/**
 * Response shape for the directory listing API.
 */
export interface DirectoryListing {
  path: string;
  items: FileInfo[];
  breadcrumbs: Breadcrumb[];
}

/**
 * Represents a mounted storage drive.
 */
export interface StorageDrive {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

/**
 * API error response.
 */
export interface ApiError {
  error: string;
  message: string;
}
