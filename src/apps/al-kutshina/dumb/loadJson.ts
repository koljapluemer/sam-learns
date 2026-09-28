const cache = new Map<string, Promise<unknown>>()

export function loadJson<T>(url: string): Promise<T> {
  let promise = cache.get(url) as Promise<T> | undefined
  if (!promise) {
    promise = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`)
      return response.json() as Promise<T>
    })
    cache.set(url, promise)
  }
  return promise
}
