import {Readable} from 'stream'
import {map} from 'async'

export function streamLimitBatch<T>(
  stream: Readable,
  processBatch: (data: T[]) => Promise<void[]>,
  size = 1
) {
  let batch: T[] = []
  stream.on('end', () => processBatch(batch))
  return async function (data: T) {
    batch.push(data)
    if (batch.length >= size) {
      stream.pause()
      try {
        await processBatch(batch)
      } catch (error) {
        console.error('Error processing data:', error)
      } finally {
        batch = []
        stream.resume()
      }
    }
    return
  }
}

export function streamLimit<T>(stream: Readable, processor: (data: T) => Promise<void>, size = 1) {
  const processBatch = async (batch: T[]) =>
    await map(batch, async (data: T) => await processor(data))
  return streamLimitBatch(stream, processBatch, size)
}
