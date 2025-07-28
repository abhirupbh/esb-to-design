export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jar':
    case 'ear':
      return 'fas fa-file-archive';
    case 'xml':
      return 'fas fa-file-code';
    case 'json':
      return 'fas fa-file-alt';
    case 'zip':
      return 'fas fa-file-archive';
    default:
      return 'fas fa-file';
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'OSB':
      return 'bg-orange-500';
    case 'Boomi':
      return 'bg-blue-600';
    case 'Tibco':
      return 'bg-green-600';
    case 'MuleSoft':
      return 'bg-purple-600';
    default:
      return 'bg-gray-500';
  }
}

export function getPlatformInitial(platform: string): string {
  switch (platform) {
    case 'OSB':
      return 'O';
    case 'Boomi':
      return 'B';
    case 'Tibco':
      return 'T';
    case 'MuleSoft':
      return 'M';
    default:
      return '?';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'uploaded':
      return 'text-blue-600';
    case 'processing':
      return 'text-yellow-600';
    case 'parsed':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'uploaded':
      return 'fas fa-clock';
    case 'processing':
      return 'fas fa-spinner fa-spin';
    case 'parsed':
      return 'fas fa-check-circle';
    case 'error':
      return 'fas fa-exclamation-triangle';
    default:
      return 'fas fa-question-circle';
  }
}

export function validateFileType(file: File): boolean {
  const allowedTypes = ['.jar', '.ear', '.zip', '.xml', '.json'];
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(extension);
}

export function validateFileSize(file: File, maxSizeMB: number = 100): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
