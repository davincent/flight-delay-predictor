# Flight Delay Predictor - Deployment Guide

This guide covers deploying the Flight Delay Predictor application using Docker containers.

## Architecture

The application consists of two containerized services:

1. **API Container** (flight-predictor-api)
   - ASP.NET Core 9.0 Web API
   - ONNX ML model for flight delay predictions
   - Exposed on port 5214 (external) → 80 (internal)

2. **Web Container** (flight-predictor-web)
   - React + Vite frontend with nginx
   - Serves static files and proxies API requests
   - Exposed on port 80

Both containers communicate via a shared Docker network (`flight-network`).

## Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- Git (for cloning the repository)
- 2GB+ available RAM
- 5GB+ available disk space

## Quick Start

### 1. Build and Start All Services

```bash
docker-compose up -d --build
```

This command will:
- Build both the API and web containers
- Start them in detached mode
- Create the network and configure health checks

### 2. Verify Services Are Running

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f web
docker-compose logs -f api
```

### 3. Access the Application

- **Web Application**: http://localhost
- **API Directly**: http://localhost:5214/api

### 4. Health Checks

The deployment includes health checks for both services:

```bash
# API health check
curl http://localhost:5214/api/Prediction/health

# Web health check (via nginx)
curl http://localhost
```

## Docker Commands Reference

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d web
docker-compose up -d api

# Start with build
docker-compose up -d --build
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop web
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100
```

### Rebuilding

```bash
# Rebuild all containers
docker-compose build

# Rebuild specific container
docker-compose build web
docker-compose build api

# Force rebuild without cache
docker-compose build --no-cache
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

## Environment Configuration

### Development

For local development, the web application uses:
- `.env.development`: Points to `http://localhost:5214/api`

### Production

For containerized deployment:
- `.env.production`: Uses relative path `/api` (proxied by nginx)

## Nginx Configuration

The web container uses nginx to:
1. Serve static React files
2. Proxy `/api/*` requests to the API container
3. Handle client-side routing (SPA fallback)
4. Add security headers
5. Enable gzip compression

Configuration file: `web/nginx.conf`

## Port Mapping

| Service | Internal Port | External Port | URL |
|---------|--------------|---------------|-----|
| Web (nginx) | 80 | 80 | http://localhost |
| API | 80 | 5214 | http://localhost:5214 |

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs api
docker-compose logs web

# Restart services
docker-compose restart
```

### API Connection Issues

1. Verify API is healthy:
```bash
curl http://localhost:5214/api/Prediction/health
```

2. Check if containers are on the same network:
```bash
docker network inspect flight-delay-predictor_flight-network
```

3. Verify nginx proxy configuration in `web/nginx.conf`

### Port Already in Use

If port 80 or 5214 is already in use, edit `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "8080:80"  # Change external port to 8080
  api:
    ports:
      - "5215:80"  # Change external port to 5215
```

### Out of Memory

```bash
# Check Docker resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Rebuild After Code Changes

```bash
# Stop, rebuild, and restart
docker-compose down
docker-compose up -d --build
```

## Production Deployment Considerations

### 1. Security

- [ ] Use HTTPS (add reverse proxy like Traefik or nginx)
- [ ] Set strong CORS policies
- [ ] Remove development endpoints
- [ ] Use environment-specific secrets
- [ ] Enable rate limiting

### 2. Performance

- [ ] Configure nginx caching
- [ ] Use CDN for static assets
- [ ] Enable compression (gzip/brotli)
- [ ] Set proper cache headers

### 3. Monitoring

- [ ] Add logging aggregation (e.g., ELK stack)
- [ ] Set up monitoring (e.g., Prometheus, Grafana)
- [ ] Configure alerts for health check failures
- [ ] Track API response times

### 4. Scaling

- [ ] Use orchestration (Kubernetes, Docker Swarm)
- [ ] Load balance multiple API instances
- [ ] Use managed database for state
- [ ] Implement API rate limiting

### 5. CI/CD

- [ ] Set up automated builds
- [ ] Add automated testing
- [ ] Configure deployment pipeline
- [ ] Implement blue-green deployments

## Cloud Deployment Options

### AWS (Elastic Container Service)

```bash
# Push images to ECR
# Deploy using ECS Task Definitions
# Use Application Load Balancer
```

### Azure (Container Apps)

```bash
# Push to Azure Container Registry
# Deploy using Container Apps
# Configure ingress
```

### Google Cloud (Cloud Run)

```bash
# Push to Artifact Registry
# Deploy using Cloud Run
# Configure service networking
```

### DigitalOcean (App Platform)

- Upload docker-compose.yml
- Configure environment variables
- Deploy with managed DNS

## File Structure

```
flight-delay-predictor/
├── docker-compose.yml          # Multi-container orchestration
├── dotnet/
│   └── FlightPredictor.API/
│       ├── Dockerfile          # API container definition
│       └── .dockerignore       # API build exclusions
└── web/
    ├── Dockerfile              # Web container definition
    ├── nginx.conf              # Nginx configuration
    ├── .dockerignore           # Web build exclusions
    ├── .env.development        # Dev environment
    └── .env.production         # Prod environment
```

## Support

For issues or questions:
1. Check container logs: `docker-compose logs -f`
2. Verify health checks: `docker-compose ps`
3. Review this documentation
4. Check project README.md
