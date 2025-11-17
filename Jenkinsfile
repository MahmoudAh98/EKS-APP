pipeline {
    agent {
        kubernetes {
            label "kaniko-build"
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: kaniko
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command:
      - cat
    tty: true
    volumeMounts:
      - name: kaniko-secret
        mountPath: /kaniko/.docker
      - name: workspace-volume
        mountPath: /workspace
  volumes:
    - name: kaniko-secret
      secret:
        secretName: dockerconfig
    - name: workspace-volume
      emptyDir: {}
"""
        }
    }

    environment {
        IMAGE_NAME = "mahmoudah98/eks"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push with Kaniko') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor \
                      --context pwd \
                      --dockerfile Dockerfile \
                      --destination \$IMAGE_NAME:latest \
                      --destination \$IMAGE_NAME:\$(git rev-parse --short HEAD)
                    """
                }
            }
        }
    }
}
