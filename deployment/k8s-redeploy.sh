kubectl config use-context do-ams3-solvalou-cluster
kubectl rollout restart deployment.apps/zximage-deployment
kubectl rollout status deployment.apps/zximage-deployment -w
kubectl get pods
