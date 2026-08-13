// Centralized (non-env) upload limits for car photos.
// Tuned for up to 30 high-resolution car photos uploaded to Convex Storage.

export const CAR_UPLOAD_MAX_FILES: number = 30;       // max number of photos per car (up to 30)
export const CAR_UPLOAD_SINGLE_MAX_MB: number = 10;    // single file limit in MB (after compression)
export const CAR_UPLOAD_TOTAL_MAX_MB: number = 200;    // total batch limit in MB (generous safety net)

export function describeCarUploadLimits() {
  return {
    maxFiles: CAR_UPLOAD_MAX_FILES,
    maxSingleMB: CAR_UPLOAD_SINGLE_MAX_MB,
    maxTotalMB: CAR_UPLOAD_TOTAL_MAX_MB,
    totalDisabled: CAR_UPLOAD_TOTAL_MAX_MB === 0,
  };
}
