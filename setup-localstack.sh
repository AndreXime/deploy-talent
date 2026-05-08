#!/bin/bash
set -e

BUCKET_NAME="files"
# Deve coincidir com EMAIL_FROM da API em desenvolvimento local (ou export LOCALSTACK_SES_FROM=...)
SES_FROM="${LOCALSTACK_SES_FROM:-noreply@localhost}"

# Criar Buckets S3
echo "Criando bucket: $BUCKET_NAME"
awslocal s3 mb s3://$BUCKET_NAME

# Configurar CORS
echo "Configurando CORS para aceitar qualquer origem no bucket '$BUCKET_NAME'"
awslocal s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

# SES: identidade "verificada" para o From usado pelo EmailService (SES API v1; compatível com o client SESv2 na API)
echo "Registando identidade SES: $SES_FROM"
awslocal ses verify-email-identity --email "$SES_FROM"
echo "Mensagens enviadas podem ser listadas em: GET http://127.0.0.1:4566/_aws/ses"

echo "--- [Provisionamento concluído!] ---"