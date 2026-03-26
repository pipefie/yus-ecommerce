declare module "stream-unzip" {
  import type { Readable } from "node:stream";

  export type ZipEntry = {
    path: string;
    type: "file" | "directory";
    size: number;
    stream: () => AsyncIterableIterator<Uint8Array>;
  };

  export function unzip(source: Readable): AsyncGenerator<ZipEntry, void, unknown>;
}
