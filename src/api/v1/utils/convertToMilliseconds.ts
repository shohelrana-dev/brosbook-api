export default function convertToMilliseconds(timeString: string) {
    if (typeof timeString !== 'string') return timeString

    const timeUnit = timeString.slice(-1) // Extract the last character
    const timeValue = parseInt(timeString.slice(0, -1)) // Extract the numeric value

    switch (timeUnit) {
        case 'd':
            return timeValue * 24 * 60 * 60 * 1000 // days to milliseconds
        case 'h':
            return timeValue * 60 * 60 * 1000 // hours to milliseconds
        case 'm':
            return timeValue * 60 * 1000 // minutes to milliseconds
        case 's':
            return timeValue * 1000 // seconds to milliseconds
        default:
            return parseInt(timeString)
    }
}
