# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Flight Delay Predictor application to your home lab Kubernetes cluster.

## Architecture

The deployment consists of:
- **API Service**: .NET backend (2 replicas) - Internal ClusterIP service
- **Web Service**: React frontend with nginx (2 replicas) - LoadBalancer service
- **Ingress**: Optional ingress controller configuration for domain-based routing

## Prerequisites

1. **Kubernetes cluster** running in your home lab
2. **kubectl** configured to access your cluster
3. **Docker images** built and available to your cluster

## Image Distribution Options

You have several options to make your Docker images available to your Kubernetes cluster:

### Option 1: Use a Local Registry (Recommended for home lab)

```bash
# Start a local registry (if you don't have one)
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Tag and push your images
docker tag flight-delay-predictor-api:latest localhost:5000/flight-delay-predictor-api:latest
docker tag flight-delay-predictor-web:latest localhost:5000/flight-delay-predictor-web:latest

docker push localhost:5000/flight-delay-predictor-api:latest
docker push localhost:5000/flight-delay-predictor-web:latest

# Update the image references in the deployment files:
# - k8s/api-deployment.yaml: change image to localhost:5000/flight-delay-predictor-api:latest
# - k8s/web-deployment.yaml: change image to localhost:5000/flight-delay-predictor-web:latest
```

### Option 2: Load Images Directly (for single-node clusters like k3s, microk8s)

```bash
# For k3s
docker save flight-delay-predictor-api:latest | sudo k3s ctr images import -
docker save flight-delay-predictor-web:latest | sudo k3s ctr images import -

# For microk8s
docker save flight-delay-predictor-api:latest > api.tar
docker save flight-delay-predictor-web:latest > web.tar
microk8s ctr image import api.tar
microk8s ctr image import web.tar
```

### Option 3: Use Docker Hub or Private Registry

```bash
# Tag with your registry
docker tag flight-delay-predictor-api:latest yourusername/flight-delay-predictor-api:latest
docker tag flight-delay-predictor-web:latest yourusername/flight-delay-predictor-web:latest

# Push to registry
docker push yourusername/flight-delay-predictor-api:latest
docker push yourusername/flight-delay-predictor-web:latest

# Update image references in deployment files accordingly
```

## Deployment Steps

### 1. Build Docker Images (if not already built)

```bash
# Build from project root
docker-compose build
```

### 2. Make Images Available to Cluster

Choose one of the options above and make your images accessible to your cluster.

### 3. Deploy to Kubernetes

```bash
# Apply all manifests in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

# Optional: Apply ingress if you have an ingress controller
kubectl apply -f k8s/ingress.yaml
```

Or apply all at once:

```bash
kubectl apply -f k8s/
```

### 4. Verify Deployment

```bash
# Check namespace
kubectl get namespace flight-predictor

# Check all resources in the namespace
kubectl get all -n flight-predictor

# Check pod status
kubectl get pods -n flight-predictor

# View pod logs
kubectl logs -n flight-predictor -l component=api
kubectl logs -n flight-predictor -l component=web

# Check services
kubectl get svc -n flight-predictor
```

## Accessing the Application

### Via LoadBalancer (if supported)

```bash
# Get the external IP
kubectl get svc flight-predictor-web -n flight-predictor

# Access via browser at the EXTERNAL-IP
```

### Via NodePort (alternative)

If LoadBalancer isn't available, modify the web service to use NodePort:

```bash
# Edit web-deployment.yaml, change service type from LoadBalancer to NodePort
kubectl apply -f k8s/web-deployment.yaml

# Get the node port
kubectl get svc flight-predictor-web -n flight-predictor

# Access via http://<node-ip>:<node-port>
```

### Via Ingress

If using ingress:

```bash
# Edit k8s/ingress.yaml and set your domain
# Update ingressClassName to match your ingress controller

# Apply the ingress
kubectl apply -f k8s/ingress.yaml

# Get ingress details
kubectl get ingress -n flight-predictor

# Add DNS entry or /etc/hosts entry pointing to your ingress controller IP
```

## Configuration

### Scaling

```bash
# Scale API
kubectl scale deployment flight-predictor-api -n flight-predictor --replicas=3

# Scale Web
kubectl scale deployment flight-predictor-web -n flight-predictor --replicas=3
```

### Resource Limits

Current resource settings:
- **API**: 256Mi-512Mi memory, 250m-500m CPU
- **Web**: 64Mi-128Mi memory, 100m-200m CPU

Adjust in the respective deployment YAML files based on your cluster capacity.

### Health Checks

Both deployments include:
- **Liveness probes**: Restart pods if unhealthy
- **Readiness probes**: Remove from service if not ready

## Updating the Application

### Rolling Update

```bash
# Build new images with a version tag
docker build -t flight-delay-predictor-api:v2 ./dotnet/FlightPredictor.API
docker build -t flight-delay-predictor-web:v2 ./web

# Push to your registry
# ... (push commands based on your chosen option)

# Update deployment
kubectl set image deployment/flight-predictor-api api=flight-delay-predictor-api:v2 -n flight-predictor
kubectl set image deployment/flight-predictor-web web=flight-delay-predictor-web:v2 -n flight-predictor

# Check rollout status
kubectl rollout status deployment/flight-predictor-api -n flight-predictor
kubectl rollout status deployment/flight-predictor-web -n flight-predictor
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/flight-predictor-api -n flight-predictor
kubectl rollout undo deployment/flight-predictor-web -n flight-predictor
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n flight-predictor

# Check logs
kubectl logs <pod-name> -n flight-predictor

# Common issues:
# - Image pull errors: Verify image is accessible
# - Resource constraints: Check node resources
# - ConfigMap not found: Ensure ConfigMap is created first
```

### Service Not Accessible

```bash
# Verify service endpoints
kubectl get endpoints -n flight-predictor

# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -n flight-predictor -- sh
# Inside the pod:
wget -O- http://flight-predictor-api/api/Prediction/health
```

### Image Pull Errors

```bash
# If using local registry, ensure all nodes can access it
# You may need to configure insecure registries in your container runtime

# For k3s, add to /etc/rancher/k3s/registries.yaml:
# mirrors:
#   "localhost:5000":
#     endpoint:
#       - "http://localhost:5000"
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete namespace (removes everything)
kubectl delete namespace flight-predictor
```

## Production Considerations

For production deployments, consider:

1. **Persistent Storage**: Add PersistentVolumes if you need to store data
2. **TLS/SSL**: Enable HTTPS via ingress with cert-manager
3. **Secrets Management**: Use Kubernetes Secrets for sensitive configuration
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Logging**: Configure centralized logging (ELK, Loki)
6. **Backup**: Regular backups of configurations and data
7. **Network Policies**: Restrict pod-to-pod communication
8. **Resource Quotas**: Set namespace resource quotas
9. **Pod Disruption Budgets**: Ensure availability during updates
10. **HorizontalPodAutoscaler**: Auto-scale based on metrics

## Example: Complete Deployment Script

```bash
#!/bin/bash

# Build images
docker-compose build

# Tag for local registry
docker tag flight-delay-predictor-api:latest localhost:5000/flight-delay-predictor-api:latest
docker tag flight-delay-predictor-web:latest localhost:5000/flight-delay-predictor-web:latest

# Push to local registry
docker push localhost:5000/flight-delay-predictor-api:latest
docker push localhost:5000/flight-delay-predictor-web:latest

# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/nginx-configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

# Wait for deployment
kubectl wait --for=condition=available --timeout=300s deployment/flight-predictor-api -n flight-predictor
kubectl wait --for=condition=available --timeout=300s deployment/flight-predictor-web -n flight-predictor

echo "Deployment complete!"
kubectl get all -n flight-predictor
```
