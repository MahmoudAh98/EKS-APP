
def KANIKO_IMAGE = "gcr.io/kaniko-project/executor:latest"
def DOCKER_HUB_CRED_ID = "docker-hub-credentials" 

pipeline {
    agent {
        kubernetes {
            cloud 'kubernetes' 
            defaultContainer 'jnlp'
        
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: ${KANIKO_IMAGE}
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker
  volumes:
  - name: docker-config
    emptyDir: {}
"""
        }
    }

  
    environment {
        DOCKER_IMAGE = "your-dockerhub-username/your-app-name:${env.BUILD_ID}"
        DOCKER_CONFIG = "${workspace}/.docker/config.json"
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build and Push with Kaniko') {
            steps {
                container('kaniko') { 
                    withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CRED_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "mkdir -p \$(dirname ${DOCKER_CONFIG})"
                        sh """
                        echo '{"auths":{"registry-1.docker.io":{"username":"${DOCKER_USERNAME}","password":"${DOCKER_PASSWORD}"}}}' > ${DOCKER_CONFIG}
                        """
                    }

                    sh """
                    /kaniko/executor --context=\$(pwd) \
                                     --dockerfile=\$(pwd)/Dockerfile \
                                     --destination=${DOCKER_IMAGE} \
                                     --insecure-skip-tls-verify \
                                     --no-push=false
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ نجح بناء الصورة ودفعها: ${DOCKER_IMAGE}"
        }
        failure {
            echo "❌ فشل البايبلاين."
        }
    }
}
