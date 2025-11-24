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
    command: ["cat"]
    tty: true
    volumeMounts:
    - name: kaniko-secret
      mountPath: /kaniko/.docker

      
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
      - cat
    tty: true
    securityContext:
      runAsUser: 1000



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
        stage("Source Code Checkout") {
            steps {
                container('jnlp') {
                    checkout scm
                }
            }
        }

        stage("Build Image & push to Dockerhub (Kaniko)") {
            displayName("Build Image & push to Dockerhub (Kaniko)")
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
        stage("Prepare Deployment Files") {
            steps {
                container('kubectl') {
                    sh '''
                        sed "s|image:.*|image: ${DOCKERHUB_REPO}:latest|" pod.yaml > pod-rendered.yaml
                    '''
                }
            }
        }

        stage("Deploy to EKS Cluster") {
            steps {
                container('kubectl') {
                    sh '''
                        # Apply Service
                        kubectl apply -f service.yaml

                        # Delete old pod if exists
                        kubectl delete pod eks-app -n app --ignore-not-found=true

                        # Apply the updated pod manifest
                        kubectl apply -f pod-rendered.yaml
                    '''
                }
            }
        }

    }
}
