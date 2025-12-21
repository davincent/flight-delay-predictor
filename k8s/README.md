# Flight Delay Predictor - Kubernetes Deployment

Deploy the Flight Delay Predictor application on your Kubernetes cluster. Pre-built multi-architecture images are available on Docker Hub.

## Prerequisites

- Kubernetes cluster (k8s, k3s, or Docker Desktop with Kubernetes enabled)
- `kubectl` installed and configured
- Git (to clone this repository)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/davincent/flight-delay-predictor.git
cd flight-delay-predictor

# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n flight-predictor

# Get the web service port
kubectl get svc flight-predictor-web -n flight-predictor
```

Access the application at `http://localhost:<PORT>` where `<PORT>` is shown in the output.

---

## Deployment Instructions by Platform

### Kubernetes (General)

**1. Clone the Repository**
```bash
git clone https://github.com/davincent/flight-delay-predictor.git
cd flight-delay-predictor
```

**2. Deploy the Application**
```bash
kubectl apply -f k8s/
```

This creates:
- Namespace: `flight-predictor`
- API Deployment (2 replicas)
- Web Deployment (2 replicas)
- Services for both components
- Nginx configuration

**3. Verify Deployment**
```bash
# Check all resources
kubectl get all -n flight-predictor

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=flight-predictor -n flight-predictor --timeout=300s
```

**4. Access the Application**

Get the NodePort assigned to the web service:
```bash
kubectl get svc flight-predictor-web -n flight-predictor
```

Look for the port mapping in the output (e.g., `80:31400/TCP`). The second number (31400 in this example) is your NodePort.

Access the application:
- **On the cluster node**: `http://localhost:<NodePort>`
- **From another machine**: `http://<node-ip>:<NodePort>`

Replace `<NodePort>` with the actual port number from the previous command.

---

### k3s (Raspberry Pi / Lightweight Kubernetes)

**1. Clone the Repository**
```bash
git clone https://github.com/davincent/flight-delay-predictor.git
cd flight-delay-predictor
```

**2. Deploy the Application**
```bash
kubectl apply -f k8s/
```

**3. Verify Image Pull**

k3s will automatically pull the ARM64 images from Docker Hub. Verify the pods are running:
```bash
kubectl get pods -n flight-predictor -w
```

Wait for all pods to show `Running` status.

**4. Access the Application**

Get the NodePort:
```bash
kubectl get svc flight-predictor-web -n flight-predictor
```

The output shows the port mapping (e.g., `80:31400/TCP`). Use the second port number.

Access the application:
```bash
# From the k3s node
http://localhost:<NodePort>

# From your network
http://<raspberry-pi-ip>:<NodePort>
```

**k3s-Specific Notes:**
- Images are pulled directly from `dgvincent/flight-predictor-api:latest` and `dgvincent/flight-predictor-web:latest`
- The multi-architecture images automatically use the ARM64 variant on Raspberry Pi
- No additional configuration needed for image architecture

---

### Docker Desktop (Windows/Mac)

**1. Enable Kubernetes**

In Docker Desktop:
- Go to Settings → Kubernetes
- Check "Enable Kubernetes"
- Click "Apply & Restart"
- Wait for Kubernetes to start (green indicator)

**2. Clone the Repository**
```bash
git clone https://github.com/davincent/flight-delay-predictor.git
cd flight-delay-predictor
```

**3. Deploy the Application**
```bash
kubectl apply -f k8s/
```

**4. Verify Deployment**
```bash
kubectl get pods -n flight-predictor
```

Wait for all pods to show `Running` status.

**5. Access the Application**

Get the NodePort:
```bash
kubectl get svc flight-predictor-web -n flight-predictor
```

Look for the port in the output (e.g., `80:31400/TCP`).

Access the application in your browser:
```
http://localhost:<NodePort>
```

**Docker Desktop Notes:**
- Uses the AMD64 architecture images automatically
- All services are accessible via `localhost`
- No need to find node IP addresses

---

## Available Services

Once deployed, the following services are available:

| Service | Type | Internal Port | Description |
|---------|------|---------------|-------------|
| flight-predictor-api | ClusterIP | 80 | Backend API (internal only) |
| flight-predictor-web | NodePort | 80 → 30000-32767 | Frontend web application |

## Monitoring and Logs

**View Pod Status**
```bash
kubectl get pods -n flight-predictor
```

**View Application Logs**
```bash
# API logs
kubectl logs -l component=api -n flight-predictor

# Web logs
kubectl logs -l component=web -n flight-predictor

# Follow logs in real-time
kubectl logs -f <pod-name> -n flight-predictor
```

**Check Service Endpoints**
```bash
kubectl get endpoints -n flight-predictor
```

## Scaling

Adjust the number of replicas as needed:

```bash
# Scale API
kubectl scale deployment flight-predictor-api -n flight-predictor --replicas=3

# Scale Web
kubectl scale deployment flight-predictor-web -n flight-predictor --replicas=3
```

## Updating

When a new version is released:

```bash
# Pull latest manifests
git pull origin main

# Apply updates
kubectl apply -f k8s/

# Watch rollout
kubectl rollout status deployment/flight-predictor-api -n flight-predictor
kubectl rollout status deployment/flight-predictor-web -n flight-predictor
```

Kubernetes will perform a rolling update with zero downtime.

## Uninstall

Remove all resources:

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete the namespace (removes everything)
kubectl delete namespace flight-predictor
```

## Resource Requirements

**Minimum Resources:**
- 2 CPU cores
- 2GB RAM
- 5GB disk space

**Per-Pod Allocations:**
- API pods: 256Mi-512Mi memory, 250m-500m CPU
- Web pods: 64Mi-128Mi memory, 100m-200m CPU

For clusters with limited resources, reduce replica counts in the deployment files before applying.

## Health Checks

Both deployments include health probes:
- **Liveness Probe**: Restarts unhealthy pods automatically
- **Readiness Probe**: Removes pods from load balancing when not ready

API health endpoint: `http://flight-predictor-api/api/Prediction/health`

## Support

For issues or questions:
- GitHub Issues: https://github.com/davincent/flight-delay-predictor/issues
- Check logs: `kubectl logs -n flight-predictor -l app=flight-predictor`

## License

[Your License Here]