const DEFAULT_REGION = 'us-central1'

export const getFunctionsBaseUrl = (): string => {
  if (import.meta.env.VITE_FUNCTIONS_BASE_URL) {
    return import.meta.env.VITE_FUNCTIONS_BASE_URL.replace(/\/$/, '')
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  if (!projectId) {
    return ''
  }

  const region = import.meta.env.VITE_FUNCTIONS_REGION || DEFAULT_REGION
  return `https://${region}-${projectId}.cloudfunctions.net`
}
