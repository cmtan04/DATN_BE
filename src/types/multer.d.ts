declare module 'multer' {
  interface MemoryStorageEngine {
    _handleFile: unknown;
    _removeFile: unknown;
  }

  export function memoryStorage(): MemoryStorageEngine;
}
