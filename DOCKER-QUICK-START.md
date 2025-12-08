# Docker Quick Start Guide

Get Radio Elgean running in Docker in 60 seconds.

## Development (Hot-Reload)

```bash
docker-compose up --build
```

Open: **http://localhost:3000**

## Production (Optimized)

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up` | Start dev environment with auto-reload |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop services |
| `docker-compose logs -f` | View logs |
| `docker-compose -f docker-compose.prod.yml up -d` | Start production |
| `docker-compose -f docker-compose.prod.yml ps` | Check status |
| `./docker-build.sh dev` | Build dev image only |
| `./docker-build.sh prod` | Build prod image only |
| `./docker-build.sh all` | Build both images |

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (dev + prod) |
| `docker-compose.yml` | Development with volumes & hot-reload |
| `docker-compose.prod.yml` | Production with health checks |
| `.dockerignore` | Files to exclude from build |
| `docker/entrypoint-dev.sh` | Dev startup script |
| `docker/entrypoint-prod.sh` | Prod startup script |
| `.env.development` | Dev environment variables |
| `.env.production` | Prod environment variables |

## Ports

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5001

## Troubleshooting

**Port in use?**
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

**Need to rebuild?**
```bash
docker-compose up --build --no-cache
```

**Database issues?**
```bash
rm database/radio_elgean.db
docker-compose up
```

## Next Steps

- Read [DOCKER.md](DOCKER.md) for detailed Docker guide
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Use `docker-build.sh` helper script for building images
- Check logs with `docker-compose logs -f` for debugging

## Architecture

```
Container
├── Express Frontend (port 3000)
│   ├── Hot-reload in dev (volume-mounted code)
│   └── Optimized in prod (pre-built code)
└── Flask Backend (port 5001)
    ├── SQLite database
    └── REST API endpoints
```

## Image Sizes

- **Development**: ~1.2 GB (includes dev tools, volumes for live editing)
- **Production**: ~500 MB (optimized, pre-built, minimal deps)

## For More Information

- Full guide: [DOCKER.md](DOCKER.md)
- Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- Project info: [CLAUDE.md](CLAUDE.md)
