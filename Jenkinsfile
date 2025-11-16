pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  serviceAccountName: jenkins
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    imagePullPolicy: Always
    command:
    - /busybox/cat
    tty: true
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  volumes:
  - name: docker-config
    secret:
      secretName: docker-config
"""
        }
    }
    
    environment {
        DOCKER_HUB_REPO = 'mahmoudah98/EKS'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        GITHUB_REPO = 'https://github.com/MahmoudAh98/EKS-APP.git'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build and Push with Kaniko') {
            steps {
                container('kaniko') {
                    sh """
                        /kaniko/executor \
                        --context=\${WORKSPACE} \
                        --dockerfile=\${WORKSPACE}/Dockerfile \
                        --destination=${DOCKER_HUB_REPO}:${IMAGE_TAG} \
                        --destination=${DOCKER_HUB_REPO}:latest \
                        --cache=true \
                        --cache-ttl=24h
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "Image pushed successfully: ${DOCKER_HUB_REPO}:${IMAGE_TAG}"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}
