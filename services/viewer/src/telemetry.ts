// Loaded with `node --import` before the app, so requests are traced from the first one.
// Does nothing locally: it only switches on when Azure provides the connection string.
// A wrong monitoring setting must never stop the app itself, so failures only log a warning.
import { useAzureMonitor } from '@azure/monitor-opentelemetry';

const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  if (!/InstrumentationKey=/i.test(connectionString)) {
    console.warn(
      'APPLICATIONINSIGHTS_CONNECTION_STRING does not look like a connection string (expected "InstrumentationKey=..."). Monitoring is off.',
    );
  } else {
    try {
      useAzureMonitor();
    } catch (err) {
      console.warn('Azure Monitor could not start; the app continues without monitoring.', err);
    }
  }
}
