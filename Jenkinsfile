pipeline {
    agent {
        kubernetes {
            serviceAccount 'jenkins-sa'
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug:v1.12.0
    command:
      - /bin/sh
    args:
      - -c
      - sleep infinity
    tty: true
    volumeMounts:
    - name: kaniko-secret
      mountPath: /kaniko/.docker

  - name: kubectl
    image: bitnami/kubectl:1.30.0
    command:
      - /bin/sh
    args:
      - -c
      - sleep infinity
    tty: true

  - name: jnlp
    image: jenkins/inbound-agent:latest
    # Do not override args

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
                container('jnlp') {
                    checkout scm
                }
            }
        }

        stage("Build and Push Docker Image") {
            steps {
                container('kaniko') {
                    sh '''
                        /kaniko/executor \
                          --dockerfile $WORKSPACE/Dockerfile \
                          --context $WORKSPACE \
                          --destination ${DOCKERHUB_REPO}:latest \
                          --cache=true
                    '''
                }
            }
        }

        stage("Deploy to EKS") {
            steps {
                container('kubectl') {
                    sh '''
                        # Apply service
                        kubectl apply -f $WORKSPACE/service.yaml

                        # Delete old pod if it exists
                        kubectl delete pod eks-app -n app --ignore-not-found=true

                        # Update pod.yaml with new image
                        sed "s|image:.*|image: ${DOCKERHUB_REPO}:latest|" $WORKSPACE/pod.yaml > $WORKSPACE/pod-rendered.yaml

                        # Apply updated pod
                        kubectl apply -f $WORKSPACE/pod-rendered.yaml
                    '''
                }
            }
        }

    }

    post {
        always {
            echo "Pipeline finished."
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed."
        }
    }
}
