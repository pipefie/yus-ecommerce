# Logging Runbook

## Shipping logs to an external sink

1. **Emit structured logs** – `src/lib/logger.ts` uses Pino and writes JSON to stdout.
2. **Choose a sink** – e.g. Datadog, CloudWatch, or Logstash.
3. **Forward stdout**:
   - In container platforms, attach a sidecar/agent (Fluent Bit, Datadog agent, etc.)
     that tails stdout and ships it to the sink.
   - Alternatively, configure a Pino transport to send logs directly:
     ```ts
     pino({ transport: { target: 'pino-http-send', options: { url: 'https://logs.example.com' } } })
     ```
4. **Set credentials & endpoints** – provide API keys and sink URLs as env vars.
5. **Verify correlation** – each request log includes `requestId`; ensure downstream
   systems retain this field for tracing.