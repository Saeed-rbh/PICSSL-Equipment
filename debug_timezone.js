const tz = require('date-fns-tz');
console.log('Exports:', Object.keys(tz));

const { zonedTimeToUtc, utcToZonedTime, fromZonedTime, toZonedTime } = tz;

const dateStr = "2026-02-12T15:30:00";
const timeZone = "America/Toronto";

console.log('Testing date:', dateStr);
console.log('Timezone:', timeZone);

try {
    if (zonedTimeToUtc) {
        const utc = zonedTimeToUtc(dateStr, timeZone);
        console.log('zonedTimeToUtc result:', utc.toISOString());
    } else {
        console.log('zonedTimeToUtc is NOT defined');
    }
} catch (e) {
    console.error('zonedTimeToUtc error:', e.message);
}

try {
    if (fromZonedTime) {
        const utc = fromZonedTime(dateStr, timeZone);
        console.log('fromZonedTime result:', utc.toISOString());
    } else {
        console.log('fromZonedTime is NOT defined');
    }
} catch (e) {
    console.error('fromZonedTime error:', e.message);
}
