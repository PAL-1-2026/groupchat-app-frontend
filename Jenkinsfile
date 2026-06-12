pipeline {
    agent any

    environment {
        AWS_REGION       = 'us-east-1'
        ECR_REGISTRY     = '801534266905.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPO         = 'kabw-groupchat/frontend'
        IMAGE_TAG        = "build-${BUILD_NUMBER}-${GIT_COMMIT[0..6]}"
        EC2_HOST         = credentials('ec2-host')
        EC2_USER         = 'ubuntu'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    rm -rf node_modules
                    npm cache clean --force
                    npm ci --include=optional
                    npm install @rollup/rollup-linux-x64-gnu --save-dev --no-package-lock
                    node -e "require('@rollup/rollup-linux-x64-gnu'); console.log('Rollup native dependency installed')"
                '''
            }
        }

        stage('Run Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build App') {
            steps {
                // VITE_API_BASE_URL dibaca dari env saat runtime container,
                // jadi untuk Docker build kita pakai placeholder dulu.
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG" -t "$ECR_REGISTRY/$ECR_REPO:latest" .'
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'aws-session-token',     variable: 'AWS_SESSION_TOKEN')
                ]) {
                    sh '''
                        aws ecr get-login-password --region "$AWS_REGION" \
                            | docker login --username AWS --password-stdin "$ECR_REGISTRY"
                        docker push "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
                        docker push "$ECR_REGISTRY/$ECR_REPO:latest"
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-deploy-key', keyFileVariable: 'SSH_KEY')]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" \
                            "bash ~/deploy.sh $IMAGE_TAG frontend"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Frontend deployed successfully: ${IMAGE_TAG}"
        }
        failure {
            echo "❌ Pipeline failed. EC2 tidak diubah."
        }
        always {
            sh 'docker rmi "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG" || true'
        }
    }
}
