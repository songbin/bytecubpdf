// src/types/mobi.d.ts
declare module 'mobi' {
  function mobi(buffer: ArrayBuffer): {
    text: string
    meta: Record<string, any>
    content: string
  }

  export { mobi }
}