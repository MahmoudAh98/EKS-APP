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
    command: ["/bin/sh", "-c", "while true; do sleep 30; done"]  # Keeps container alive with shell
    tty: true  # <-- Remove this line (not needed for sh steps)


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
                echo "Starting kubectl commands..."
                kubectl get pods -n jenkins
                echo "Pods retrieved, now creating pod..."
                kubectl run nginx2 --image nginx
                echo "Pod creation attempted."
            '''

        }
    }
}

    }
}
