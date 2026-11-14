/** Resolve public assets beside index.html, including an embedded subdirectory build. */
export const assetUrl = (name: string): string => `${import.meta.env.BASE_URL}assets/${name}`;
