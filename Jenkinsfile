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
    image: gcr.io/kaniko-project/executor:debug
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
    image: bitnami/kubectl:latest

  - name: jnlp
    image: jenkins/inbound-agent:latest
    # DO NOT override args here!
  
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

        stage("Build-Push Image (Kaniko)") {
            steps {
                container('kaniko') {
                    sh '''
                        /kaniko/executor \
                          --dockerfile Dockerfile \
                          --context `pwd` \
                          --destination ${DOCKERHUB_REPO}:latest \
                          --cache=true
                    '''
                }
            }
        }
        stage("Deploy Pod to EKS") {
    steps {
        container('kubectl') {
            sh '''
                # Apply service
                kubectl apply -f service.yaml

                # Delete old pod (if exists)
                kubectl delete pod eks-app -n app --ignore-not-found=true

                # Replace image with latest before creating
                sed "s|image:.*|image: ${DOCKERHUB_REPO}:latest|" pod.yaml > pod-rendered.yaml

                # Apply Pod
                kubectl apply -f pod-rendered.yaml
            '''
        }
    }
}

    }
}


