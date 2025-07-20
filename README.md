# SoftUni AWS Essentials June 2025

This repository contains coursework and exercises for the SoftUni AWS Essentials course (June 2025 edition).

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## AWS CLI Commands

* `aws configure` – Set up your AWS credentials and default region
* `aws s3 ls` – List S3 buckets
* `aws ec2 describe-instances` – List EC2 instances
* `aws cloudformation list-stacks` – List CloudFormation stacks
* `aws sts get-caller-identity` – Show details about the current AWS identity (useful for verifying credentials)

## AWS CDK Commands

### Project Initialization
- `cdk init app --language=typescript` – Initialize a new CDK project

### Environment Setup
- `cdk bootstrap` – Prepare your AWS environment for deploying CDK apps (creates necessary resources like S3 buckets for assets)

### Build & Synthesis
- `cdk build` – Compile your CDK TypeScript or JavaScript app
- `cdk synth` – Synthesize and print the CloudFormation template for your app

### Stack Management
- `cdk list` – List all stacks in your CDK app
- `cdk diff` – Compare your local stack with the deployed stack and show differences
- `cdk deploy` – Deploy your stack(s) to AWS10
- `cdk destroy` – Delete the deployed stack(s) from AWS

### Diagnostics & Utilities
- `cdk doctor` – Diagnose and check your CDK setup for potential problems

### Context Management
- `cdk context` – Manage cached context values

## CloudFormation

- **Template**: A JSON or YAML file that defines AWS resources and their configurations. Used as the blueprint for your infrastructure.
- **Change Sets**: A summary of proposed changes to your stack before execution. Allows you to review how updates will affect your resources.
- **Stack Sets**: Manage stacks across multiple AWS accounts and regions with a single operation. Useful for large-scale, multi-account deployments.