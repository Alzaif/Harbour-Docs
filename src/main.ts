import { serve } from '@hono/node-server';
import { createDocsDependencies } from './bootstrap/create-docs-dependencies.js';
import { createApp } from './infrastructure/http/app.js';

const deps = await createDocsDependencies();
const app = createApp(deps);

serve(
  {
    fetch: app.fetch,
    port: deps.config.PORT,
  },
  (info) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message: 'Harbour Docs API listening',
        port: info.port,
        trustGateway: deps.config.TRUST_GATEWAY_HEADERS,
        pdfExport: deps.config.EXPORT_PDF_ENABLED,
      }),
    );
  },
);
