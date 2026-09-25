# node:sqlite (Weg A, lokal) braucht Node 24 ohne Flag — dieselbe Version wie in der Entwicklung.
# -slim statt -alpine: sharp (Bildverarbeitung) lädt dafür vorgefertigte Binärdateien, kein Kompilieren nötig.
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Läuft ohne DATABASE_URL nicht: Postgres ist im Betrieb Pflicht (Weg C), SQLite ist nur für die lokale
# Entwicklung gedacht (Datei im Container wäre bei jedem Deploy weg). Echte Werte kommen aus der
# Coolify-Oberfläche, nie aus diesem Repository (ADMIN_PASSWORD, ANTHROPIC_API_KEY, DATABASE_URL, SMTP_URL).
CMD ["node", "server.js"]
