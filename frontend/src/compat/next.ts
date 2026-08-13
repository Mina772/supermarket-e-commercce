export interface Metadata {
  title?: string | { default: string; template?: string };
  description?: string;
  [key: string]: unknown;
}

export interface Viewport {
  [key: string]: unknown;
}

export interface MetadataRoute {
  [key: string]: unknown;
}