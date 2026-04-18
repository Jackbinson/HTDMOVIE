const rawApiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const buildAssetUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  return `${ASSET_BASE_URL}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
};
