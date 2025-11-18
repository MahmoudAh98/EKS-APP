pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
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
  - name: jnlp
    image: jenkins/inbound-agent:latest
    args: ['']
  volumes:
  - name: kaniko-secret
    secret:
      secretName: dockerconfig
            """
        }
    }

    environment {
        DOCKERHUB_REPO = "mahmoudah98/eks"
    }

    stages {

        stage("Checkout") {
            steps {
                // Checkout happens in the jnlp container
                container('jnlp') {
                    checkout scm
                }
            }
        }

        stage("Build & Push Image With Kaniko") {
            steps {
                container('kaniko') {
                    sh '''
                        echo "Building Docker image with Kaniko..."

                        /kaniko/executor \
                          --context `pwd` \
                          --dockerfile Dockerfile \
                          --destination ${DOCKERHUB_REPO}:latest \
                          --cache=true
                    '''
                }
            }
        }
    }
}
