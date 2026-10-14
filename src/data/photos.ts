// Verified Unsplash stand-ins (free licence). Filled from the photo-curation pass.
export type Photo = { url: string; alt: string; by?: string }

export const PHOTOS: Record<string, { portrait: Photo; portrait2?: Photo; world: Photo[] }> = {}
export const VENUE_PHOTOS: Photo[] = []
export const TEXTURES: Photo[] = []
