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
  serviceAccountName: jenkins-sa
  containers:
  - name: docker
    image: docker:24-dind
    command:
    - dockerd
    - --host=unix:///var/run/docker.sock
    - --host=tcp://0.0.0.0:2375
    securityContext:
      privileged: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run
  - name: docker-client
    image: docker:24
    command:
    - sleep
    args:
    - 99d
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run
  volumes:
  - name: docker-sock
    emptyDir: {}
"""
        }
    }
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE = "mahmoudah98/your-app-name"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Docker Image') {
            steps {
                container('docker-client') {
                    script {
                        sh """
                            docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} .
                            docker tag ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }
        
        stage('Push to DockerHub') {
            steps {
                container('docker-client') {
                    script {
                        sh """
                            echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin
                            docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                            docker push ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                container('docker-client') {
                    sh """
                        docker logout
                        docker rmi ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest || true
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "Pipeline succeeded! Image pushed: ${DOCKER_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo "Pipeline failed!"
        }
        always {
            cleanWs()
        }
    }
}
