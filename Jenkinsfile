pipeline {
    agent {
        kubernetes {
            label "kaniko-build"
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:latest
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
        DOCKER_IMAGE = "mahmoudah98/eks"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image with Kaniko') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor \
                      --context `pwd` \
                      --dockerfile Dockerfile \
                      --destination \$DOCKER_IMAGE:latest \
                      --destination \$DOCKER_IMAGE:\$(git rev-parse --short HEAD)
                    """
                }
            }
        }
    }
}
