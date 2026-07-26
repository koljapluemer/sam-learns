// Parses the 'HH:MM:SS.mmm' timestamps used in the segment data files into
// seconds, as required by the YouTube player's seekTo/getCurrentTime API.
export function parseTimeCode(code: string): number {
  const [hours, minutes, secondsWithMs] = code.split(':')
  const [seconds, milliseconds] = secondsWithMs.split('.')
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(milliseconds ?? 0) / 1000
}
