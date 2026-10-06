import { getCachedAudioBlob } from './audioCache';

export async function downloadAudioFile(
  audioUrl: string,
  suggestedFilename: string,
  audioId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. If it's already a blob: or data: URL, we can trigger direct anchor download
    if (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:')) {
      triggerAnchorDownload(audioUrl, suggestedFilename);
      return { success: true };
    }

    // 2. Check IndexedDB offline cache first
    if (audioId) {
      const cachedBlob = await getCachedAudioBlob(audioId);
      if (cachedBlob) {
        const localBlobUrl = window.URL.createObjectURL(cachedBlob);
        triggerAnchorDownload(localBlobUrl, suggestedFilename);
        setTimeout(() => {
          window.URL.revokeObjectURL(localBlobUrl);
        }, 2000);
        return { success: true };
      }
    }

    // 3. Fetch the audio binary from server and convert to a local Blob
    // Append ?download=1 to hint the server
    const fetchUrl = audioUrl.includes('?') ? `${audioUrl}&download=1` : `${audioUrl}?download=1`;
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const blob = await response.blob();
    const localBlobUrl = window.URL.createObjectURL(blob);

    // 3. Trigger download via programmatic local blob click
    triggerAnchorDownload(localBlobUrl, suggestedFilename);

    // Cleanup after short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(localBlobUrl);
    }, 2000);

    return { success: true };
  } catch (err: any) {
    console.warn('Programmatic blob download failed, falling back to direct link:', err);

    try {
      // Fallback: direct anchor with download attribute & target blank
      const fallbackUrl = audioUrl.includes('?') ? `${audioUrl}&download=1` : `${audioUrl}?download=1`;
      triggerAnchorDownload(fallbackUrl, suggestedFilename);
      return { success: true };
    } catch (fallbackErr: any) {
      console.error('All download mechanisms failed:', fallbackErr);
      return {
        success: false,
        error: err?.message || 'Could not download audio file',
      };
    }
  }
}

function triggerAnchorDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Allow browser time to register click event before removing
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 300);
}
