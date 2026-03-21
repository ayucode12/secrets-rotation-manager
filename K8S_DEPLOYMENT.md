# Kubernetes Deployment Configuration for Secrets Rotation Manager

## Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Docker image pushed to registry

## Files Included
- deployment.yaml - Application deployment
- service.yaml - Service exposure
- configmap.yaml - Configuration
- secret.yaml - Sensitive data
- mongodb-statefulset.yaml - MongoDB deployment

## Deployment Steps

### 1. Create Namespace
```bash
kubectl create namespace secrets-rotation
```

### 2. Create Secrets
```bash
kubectl create secret generic secrets-rotation-config \
  --from-literal=ENCRYPTION_KEY=your_secure_key_here \
  --from-literal=MONGO_PASSWORD=mongodb_password \
  -n secrets-rotation
```

### 3. Deploy MongoDB (if using in-cluster)
```bash
kubectl apply -f k8s/mongodb-statefulset.yaml -n secrets-rotation
```

### 4. Deploy Application
```bash
kubectl apply -f k8s/deployment.yaml -n secrets-rotation
kubectl apply -f k8s/service.yaml -n secrets-rotation
```

### 5. Verify Deployment
```bash
kubectl get pods -n secrets-rotation
kubectl get svc -n secrets-rotation
kubectl logs -f deployment/secrets-rotation-manager -n secrets-rotation
```

## Accessing the Application

### Port Forward
```bash
kubectl port-forward -n secrets-rotation svc/secrets-rotation-manager 5000:5000
curl http://localhost:5000/health
```

### Ingress (Optional)
```bash
kubectl apply -f k8s/ingress.yaml -n secrets-rotation
# Update DNS to point to your ingress endpoint
```

## Scaling

```bash
kubectl scale deployment secrets-rotation-manager --replicas=3 -n secrets-rotation
```

## Monitoring

```bash
# Watch deployment status
kubectl rollout status deployment/secrets-rotation-manager -n secrets-rotation

# Check events
kubectl get events -n secrets-rotation

# View logs
kubectl logs -l app=secrets-rotation-manager -n secrets-rotation -f
```

## Cleanup

```bash
kubectl delete namespace secrets-rotation
```

## Notes
- Configure persistent volumes for MongoDB
- Set resource limits/requests appropriately
- Use NetworkPolicies for security
- Configure HPA for auto-scaling
