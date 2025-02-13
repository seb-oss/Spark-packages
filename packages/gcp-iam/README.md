# `@sebspark/gcp-iam`

Google IAM utilities. This package is intended to be run in GCP contexts, such as running under a GKE service account using Workload Identity.


# Explanation

It generates the JWT that we put into the proxy-authorization header. That JWT is signed by the GCP service account and the aud part of the JWT is set to the URL we are going to call in the API Gateway.
 
Generating and signing the JWT uses a bunch of CPU cycles, so it makes sense to cache them for a short time.
