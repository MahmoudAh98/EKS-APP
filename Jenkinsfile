pipeline {
  agent {
    kubernetes {
      label "kaniko-build-${env.BUILD_ID}"
      yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins-sa
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:latest
    command:
      - /busybox/busybox
    args:
      - sh
      - -c
      - "sleep 9999999"
    tty: true
    volumeMounts:
      - name: kaniko-docker-config
        mountPath: /kaniko/.docker
      - name: workspace
        mountPath: /workspace

  - name: jnlp
    image: jenkins/inbound-agent:latest
    args:
      - "jenkins-agent"

  volumes:
    - name: kaniko-docker-config
      secret:
        secretName: dockerconfig
        items:
          - key: .dockerconfigjson
            path: config.json
    - name: workspace
      emptyDir: {}
"""
    }
  }

  environment {
    DOCKERHUB_REPO = "mahmoudah98/eks-app"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'cp -R . /workspace || true'
      }
    }

    stage('Build & Push with Kaniko') {
      steps {
        container('kaniko') {
          sh '''
            /kaniko/executor \
              --context /workspace \
              --dockerfile /workspace/Dockerfile \
              --destination ${DOCKERHUB_REPO}:latest \
              --destination ${DOCKERHUB_REPO}:$(git rev-parse --short HEAD)
          '''
        }
      }
    }
  }

  post {
    always {
      echo "Pipeline finished with result: ${currentBuild.currentResult}"
    }
  }
}
