// Downloads the logos of the OneLeft stack into assets/logos: coloured SVG (README, thesis) and 128 px high PNG
// (PlantUML diagrams), plus SOURCES.md with the origin and licence of each one. Re-run it to update them.
// Usage (after npm install in tools/): node tools/fetch-logos.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { launch, pause } from './lib/app.mjs';

const OUT = new URL('../assets/logos/', import.meta.url).pathname;
const SIMPLE_ICONS = 'https://cdn.jsdelivr.net/npm/simple-icons@16.33.0';
const GILBARBARA = 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos';
const GITHUB = 'https://cdn.jsdelivr.net/gh';

/** si: Simple Icons slug (monochrome path coloured with its brand colour); url: file from another source. */
const LOGOS = [
  // Frontend and mobile app
  { id: 'angular', name: 'Angular', group: 'Frontend', si: 'angular' },
  { id: 'typescript', name: 'TypeScript', group: 'Frontend', si: 'typescript' },
  { id: 'primeng', name: 'PrimeNG', group: 'Frontend', si: 'primeng' },
  { id: 'tailwindcss', name: 'Tailwind CSS', group: 'Frontend', si: 'tailwindcss' },
  { id: 'leaflet', name: 'Leaflet', group: 'Frontend', si: 'leaflet' },
  { id: 'openstreetmap', name: 'OpenStreetMap', group: 'Frontend', si: 'openstreetmap' },
  { id: 'vitest', name: 'Vitest', group: 'Frontend', si: 'vitest' },
  { id: 'capacitor', name: 'Capacitor', group: 'Mobile', si: 'capacitor' },
  { id: 'android', name: 'Android', group: 'Mobile', si: 'android' },
  // Backend
  { id: 'java', name: 'Java (OpenJDK)', group: 'Backend', si: 'openjdk' },
  { id: 'springboot', name: 'Spring Boot', group: 'Backend', si: 'springboot' },
  { id: 'spring', name: 'Spring Cloud Gateway / Security', group: 'Backend', si: 'spring' },
  { id: 'hibernate', name: 'Hibernate', group: 'Backend', si: 'hibernate' },
  { id: 'flyway', name: 'Flyway', group: 'Backend', si: 'flyway' },
  { id: 'maven', name: 'Apache Maven', group: 'Backend', si: 'apachemaven' },
  { id: 'openapi', name: 'OpenAPI', group: 'Backend', si: 'openapiinitiative' },
  { id: 'swagger', name: 'Swagger UI', group: 'Backend', si: 'swagger' },
  { id: 'keycloak', name: 'Keycloak', group: 'Security', si: 'keycloak' },
  // Testing and quality
  { id: 'junit5', name: 'JUnit 5', group: 'Testing', si: 'junit5' },
  { id: 'testcontainers', name: 'Testcontainers', group: 'Testing', url: `${GITHUB}/testcontainers/testcontainers-java@main/docs/logo.svg`, licence: 'Testcontainers project logo (MIT repository)' },
  { id: 'archunit', name: 'ArchUnit', group: 'Testing', url: `${GITHUB}/TNG/ArchUnit@main/docs/assets/ArchUnit-Logo.png`, licence: 'ArchUnit project logo (Apache-2.0 repository)' },
  { id: 'jacoco', name: 'JaCoCo', group: 'Testing', url: 'https://www.jacoco.org/images/jacoco.png', licence: 'JaCoCo project logo (EPL-2.0 project)' },
  { id: 'sonarqubecloud', name: 'SonarQube Cloud', group: 'Quality', si: 'sonarqubecloud' },
  { id: 'puppeteer', name: 'Puppeteer', group: 'Testing', si: 'puppeteer' },
  // Data and messaging
  { id: 'postgresql', name: 'PostgreSQL', group: 'Data', si: 'postgresql' },
  { id: 'postgis', name: 'PostGIS', group: 'Data', url: `${GITHUB}/postgis/postgis@master/doc/html/images/static/PostGIS_logo.png`, licence: 'PostGIS project logo (GPL-2.0 repository)' },
  { id: 'rabbitmq', name: 'RabbitMQ', group: 'Data', si: 'rabbitmq' },
  { id: 'redis', name: 'Redis', group: 'Data', si: 'redis' },
  // Infrastructure and cloud
  { id: 'docker', name: 'Docker', group: 'Infrastructure', si: 'docker' },
  { id: 'aws', name: 'Amazon Web Services', group: 'Cloud', url: `${GILBARBARA}/aws.svg`, licence: 'CC0-1.0 (gilbarbara/logos); trademark of Amazon' },
  { id: 'aws-rds', name: 'Amazon RDS', group: 'Cloud', url: `${GILBARBARA}/aws-rds.svg`, licence: 'CC0-1.0 (gilbarbara/logos); trademark of Amazon' },
  { id: 'aws-s3', name: 'Amazon S3', group: 'Cloud', url: `${GILBARBARA}/aws-s3.svg`, licence: 'CC0-1.0 (gilbarbara/logos); trademark of Amazon' },
  { id: 'aws-elb', name: 'Elastic Load Balancing', group: 'Cloud', url: `${GILBARBARA}/aws-elb.svg`, licence: 'CC0-1.0 (gilbarbara/logos); trademark of Amazon' },
  { id: 'aws-cloudwatch', name: 'Amazon CloudWatch', group: 'Cloud', url: `${GILBARBARA}/aws-cloudwatch.svg`, licence: 'CC0-1.0 (gilbarbara/logos); trademark of Amazon' },
  // Observability
  { id: 'prometheus', name: 'Prometheus', group: 'Observability', si: 'prometheus' },
  { id: 'grafana', name: 'Grafana', group: 'Observability', si: 'grafana' },
  { id: 'loki', name: 'Grafana Loki', group: 'Observability', url: `${GITHUB}/grafana/loki@main/docs/sources/logo.png`, licence: 'Grafana Loki logo (AGPL-3.0 repository); trademark of Grafana Labs' },
  { id: 'micrometer', name: 'Micrometer', group: 'Observability', url: `${GITHUB}/micrometer-metrics/micrometer-docs@main/src/img/logo-no-title.svg`, licence: 'Micrometer project logo (Apache-2.0 repository)' },
  // Process and tools
  { id: 'git', name: 'Git', group: 'Tools', si: 'git' },
  { id: 'github', name: 'GitHub (Projects, repositories)', group: 'Tools', si: 'github' },
  { id: 'githubactions', name: 'GitHub Actions', group: 'Tools', si: 'githubactions' },
  { id: 'slack', name: 'Slack', group: 'Tools', url: `${GILBARBARA}/slack-icon.svg`, licence: 'CC0-1.0 (gilbarbara/logos); trademark of Salesforce' },
  { id: 'intellijidea', name: 'IntelliJ IDEA', group: 'Tools', si: 'intellijidea' },
  { id: 'webstorm', name: 'WebStorm', group: 'Tools', si: 'webstorm' },
  { id: 'nodejs', name: 'Node.js', group: 'Tools', si: 'nodedotjs' },
  { id: 'plantuml', name: 'PlantUML', group: 'Tools', url: 'https://plantuml.com/logo3.png', licence: 'PlantUML project logo' },
];

const get = async (url, as = 'text') => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return as === 'text' ? response.text() : Buffer.from(await response.arrayBuffer());
};

mkdirSync(`${OUT}svg`, { recursive: true });
mkdirSync(`${OUT}png`, { recursive: true });
const catalog = JSON.parse(await get(`${SIMPLE_ICONS}/data/simple-icons.json`));
const sources = [];
const images = [];

for (const logo of LOGOS) {
  if (logo.si) {
    const data = catalog.find((icon) => icon.slug === logo.si);
    const svg = (await get(`${SIMPLE_ICONS}/icons/${logo.si}.svg`)).replace('<svg ', `<svg fill="#${data.hex}" `);
    writeFileSync(`${OUT}svg/${logo.id}.svg`, svg);
    images.push({ id: logo.id, type: 'svg', data: svg });
    sources.push([logo, `Simple Icons \`${logo.si}\``, data.license?.type ?? 'CC0-1.0 (Simple Icons)', data.source]);
  } else {
    const isSvg = logo.url.endsWith('.svg');
    const data = await get(logo.url, isSvg ? 'text' : 'binary');
    if (isSvg) {
      writeFileSync(`${OUT}svg/${logo.id}.svg`, data);
    }
    images.push({ id: logo.id, type: isSvg ? 'svg' : 'png', data });
    sources.push([logo, 'Project / brand', logo.licence, logo.url]);
  }
}

// PNG 128 px high for every logo (PlantUML embeds bitmaps), rendered by Chrome
const browser = await launch();
try {
  const page = await browser.newPage();
  for (const image of images) {
    const src =
      image.type === 'svg'
        ? `data:image/svg+xml;base64,${Buffer.from(image.data).toString('base64')}`
        : `data:image/png;base64,${image.data.toString('base64')}`;
    await page.setContent(`<body style="margin:0;background:transparent"><img id="logo" src="${src}" style="height:128px"></body>`);
    await page.waitForFunction(() => document.getElementById('logo').complete);
    await pause(50);
    const element = await page.$('#logo');
    await element.screenshot({ path: `${OUT}png/${image.id}.png`, omitBackground: true });
  }
} finally {
  await browser.close();
}

const rows = sources.map(([logo, origin, licence, url]) => `| ${logo.name} | \`${logo.id}\` | ${origin} | ${licence} | <${url}> |`);
writeFileSync(
  `${OUT}SOURCES.md`,
  `# Technology logos\n\nGenerated by \`tools/fetch-logos.mjs\`. The logos are trademarks of their owners and are used only to\nidentify the technologies of the project (nominative use).\n\n| Technology | File | Origin | Licence | Source |\n|---|---|---|---|---|\n${rows.join('\n')}\n`,
);
console.log(`${LOGOS.length} logos in ${OUT}`);
