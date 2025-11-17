// Define Agent: Use the jenkins/inbound-agent image as the main container 
// and add the Kaniko sidecar container for building the image.

// Global Variables
def KANIKO_IMAGE = "gcr.io/kaniko-project/executor:latest"
// Ensure this ID exactly matches your Docker Hub Credentials ID in Jenkins
def DOCKER_HUB_CRED_ID = "docker-hub-credentials" 

pipeline {
    agent {
        kubernetes {
            // Must match the name of the Kubernetes Cloud configuration in Jenkins
            cloud 'kubernetes' 
            defaultContainer 'jnlp'
            
            // Define the dynamic Pod Template and add the Kaniko container (Sidecar)
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: ${KANIKO_IMAGE}
    imagePullPolicy: Always
    
    // FIX for 'exec: "cat": executable file not found': 
    // Use 'sleep' to keep the container running until Jenkins sends commands.
    command:
    - /busybox/sh
    args:
    - -c
    - sleep 999999
    
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

    // Environment Variables
    environment {
        // The name of the image to be built and pushed
        DOCKER_IMAGE = "mahmoudah98/eks:${env.BUILD_ID}"
        // Path to the Docker config file within the Kaniko mount path
        DOCKER_CONFIG = "/kaniko/.docker/config.json"
    }

    // Pipeline Stages
    stages {
        stage('Checkout Code') {
            steps {
                echo 'Starting code checkout...'
                // Pull the code from the SCM repository
                checkout scm 
            }
        }

        stage('Build and Push with Kaniko') {
            steps {
                // 1. Create the config.json file for Kaniko using stored Docker Hub credentials
                container('jnlp') { // Execute this step in the main JNLP container
                    // Ensure the directory exists
                    sh "mkdir -p \$(dirname ${DOCKER_CONFIG})"

                    // Use Jenkins credentials to generate the config.json file
                    withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CRED_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh """
                        echo '{"auths":{"https://index.docker.io/v1/":{"username":"${DOCKER_USERNAME}","password":"${DOCKER_PASSWORD}"}}}' > ${DOCKER_CONFIG}
                        """
                    }
                    echo "Docker config file created in ${DOCKER_CONFIG}"
                }

                // 2. Use Kaniko to build and push the image
                container('kaniko') { // Execute this step inside the Kaniko sidecar container
                    // Kaniko will automatically use the config.json file created above
                    sh """
                    /kaniko/executor --context=\$(pwd) \
                                     --dockerfile=\$(pwd)/Dockerfile \
                                     --destination=${DOCKER_IMAGE} \
                                     --no-push=false
                    """
                }
            }
        }
    }

    // Post-build Steps
    post {
        success {
            echo "✅ Successfully built and pushed image: ${DOCKER_IMAGE}"
        }
        failure {
            echo "❌ Pipeline failed."
        }
        // FIX for 'No steps specified for branch': Must include a steps block.
        always {
            steps {
                echo "Pipeline finished, performing cleanup (if any)."
            }
        }
    }
}
