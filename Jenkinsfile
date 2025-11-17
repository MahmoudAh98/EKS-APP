// تحديد Agent: استخدام صورة jenkins/inbound-agent كحاوية رئيسية لتشغيل البايبلاين
// وإضافة حاوية Kaniko (Sidecar) التي ستقوم بالبناء.

// متغيرات عامة
def KANIKO_IMAGE = "gcr.io/kaniko-project/executor:latest"
def DOCKER_HUB_CRED_ID = "docker-hub-credentials" // تأكد من مطابقة هذا لـ ID بيانات اعتماد Docker Hub في Jenkins

pipeline {
    agent {
        kubernetes {
            cloud 'kubernetes' // يجب أن يطابق اسم السحابة التي قمت بتكوينها في Jenkins
            defaultContainer 'jnlp'
            
            // تعريف قالب البود الديناميكي وإضافة حاوية Kaniko
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: kaniko
    image: ${KANIKO_IMAGE}
    imagePullPolicy: Always
    

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

    // إعداد متغيرات البيئة
    environment {
        // اسم الصورة التي سيتم بناؤها ودفعها
        DOCKER_IMAGE = "mahmoudah98/eks:${env.BUILD_ID}"
        // مسار ملف تكوين Docker لتخزين بيانات الاعتماد (يجب أن يكون داخل Kaniko Path)
        DOCKER_CONFIG = "/kaniko/.docker/config.json"
        
        // المتغيرات الخاصة بالبايبلاين
        GIT_CREDENTIALS_ID = 'your-git-credentials-id' // استبدل هذا بـ ID بيانات اعتماد Git إذا كنت تحتاجها هنا
    }

    // مراحل البايبلاين
    stages {
        stage('Checkout Code') {
            steps {
                echo 'Starting code checkout...'
                // سحب الكود من المستودع باستخدام بيانات اعتماد Git المحددة
                checkout scm 
            }
        }

        stage('Build and Push with Kaniko') {
            steps {
                // 1. إنشاء ملف config.json لـ Kaniko باستخدام بيانات اعتماد Docker Hub المخزنة في Jenkins
                container('jnlp') { // تنفيذ هذه الخطوة في الحاوية الرئيسية (jnlp)
                    // التأكد من وجود المجلد
                    sh "mkdir -p \$(dirname ${DOCKER_CONFIG})"

                    // استخدام بيانات الاعتماد لإنشاء ملف config.json
                    withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CRED_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh """
                        echo '{"auths":{"https://index.docker.io/v1/":{"username":"${DOCKER_USERNAME}","password":"${DOCKER_PASSWORD}"}}}' > ${DOCKER_CONFIG}
                        """
                    }
                    echo "Docker config file created in ${DOCKER_CONFIG}"
                }

                // 2. استخدام Kaniko لبناء الصورة ودفعها
                container('kaniko') { // تشغيل الخطوات داخل حاوية Kaniko
                    // Kaniko سيستخدم ملف config.json الذي تم إنشاؤه في الخطوة السابقة 
                    // داخل المجلد /kaniko/.docker
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

    // خطوات ما بعد البناء
    post {
        success {
            echo "✅ نجح بناء الصورة ودفعها: ${DOCKER_IMAGE}"
            // يمكنك إضافة خطوات نشر (Deploy) هنا
        }
        failure {
            echo "❌ فشل البايبلاين."
        }
        always {
            // تنظيف أي موارد مؤقتة إذا لزم الأمر
        }
    }
}
