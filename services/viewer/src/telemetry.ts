// Loaded with `node --import` before the app, so requests are traced from the first one.
// Does nothing locally: it only switches on when Azure provides the connection string.
import { useAzureMonitor } from '@azure/monitor-opentelemetry';

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  useAzureMonitor();
}
