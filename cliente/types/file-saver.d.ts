declare module 'file-saver' {
  export function saveAs(data: Blob, filename?: string, disableAutoBOM?: boolean): void;
}
