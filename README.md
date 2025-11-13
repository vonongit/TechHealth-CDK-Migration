# TechHealth Infrastructure Migration

[![Deploy Infrastructure](https://github.com/vonongit/TechHealth-CDK-Migration/actions/workflows/deploy.yml/badge.svg)](https://github.com/vonongit/TechHealth-CDK-Migration/actions/workflows/deploy.yml)

Converting a manually-deployed healthcare platform from click-ops to Infrastructure as Code using AWS CDK.

---

## The Challenge

TechHealth's AWS infrastructure was originally deployed through the AWS console (click-ops), making it difficult to track changes, replicate environments, or roll back updates. This project demonstrates migrating that infrastructure to code using AWS CDK.

---

## What I Built

![Architecture Diagram](Screenshots/architecture-diagram.png)

Replicated and automated deployment of a full healthcare platform infrastructure:

- **EC2 Instances** - Application servers hosting the platform
- **RDS Database** - PostgreSQL/MySQL database for patient data
- **VPC & Networking** - Isolated network with public/private subnets
- **Security Groups** - Network security rules controlling access
- **IAM Roles** - Role-based access control between resources

---

## Technologies Used

- **AWS CDK** (Cloud Development Kit)
- **TypeScript** (CDK language)
- **AWS Services** - EC2, RDS, VPC, IAM
- **CloudFormation** (underlying deployment)
- **GitHub Actions** (CI/CD pipeline)
- **Git** (version control)

---

## Key Accomplishments

✅ **Reproduced existing infrastructure** - Analyzed click-ops setup and recreated it entirely as code

✅ **Version control** - Infrastructure changes now tracked in Git with full history

✅ **Repeatability** - Can deploy/tear down entire environment consistently

✅ **CI/CD Pipeline** - Automated validation and deployment on every push

✅ **Documentation** - All resources defined in code serve as living documentation

---

## Technical Implementation

### Infrastructure Design

- Multi-tier architecture with public and private subnets
- Security groups implementing least-privilege access
- RDS in private subnet, only accessible from application tier
- IAM roles following principle of least privilege

### CI/CD Pipeline

Implemented GitHub Actions pipeline that automatically validates and deploys infrastructure changes:

**Pipeline Flow:**

1. Code pushed to `main` branch triggers workflow
2. Validates TypeScript compilation and CDK synthesis
3. Automatically deploys changes to AWS

**Benefits:**

- Catches errors before deployment
- Consistent deployment process
- Full audit trail in GitHub Actions
- Eliminates manual deployment steps

Setup: Add AWS credentials as GitHub secrets, and the pipeline handles the rest automatically.

### Deployment Process

Implemented full IaC workflow:
```bashcdk bootstrap  # One-time environment setup
cdk synth      # Generate CloudFormation templates
cdk diff       # Preview changes before deployment
cdk deploy     # Deploy infrastructure

### Challenges Solved

**Detailed in [IMPLEMENTATION.md](IMPLEMENTATION.md):**

- **CDK Project Structure** - Learned proper CDK initialization requirements
- **Bootstrap Stack Failures** - Resolved S3 bucket conflicts from failed attempts
- **S3 Versioning** - Handled versioned bucket deletion during teardown
- **TypeScript Syntax** - Adapted from Terraform to TypeScript's type-safe approach
- **Resource Dependencies** - Properly ordered resource creation/deletion
- **State Management** - Managed CloudFormation stacks and CDK bootstrap resources

---

## Running This Project

**Prerequisites:** Node.js, AWS CLI, AWS CDK, configured AWS credentials

**Deploy:**
```bashnpm install
cdk bootstrap aws://ACCOUNT-ID/AWS-REGION
cdk deploy --all

**Teardown:**
```bashcdk destroy --all

---

## What This Demonstrates

### Cloud Infrastructure Skills

- Designing multi-tier AWS architectures
- Implementing network security best practices
- Managing infrastructure lifecycle

### DevOps/IaC Skills

- Infrastructure as Code with AWS CDK
- CloudFormation stack management
- CI/CD pipeline implementation
- Version control for infrastructure

### Problem Solving

- Migrating legacy infrastructure to modern practices
- Troubleshooting deployment issues
- Understanding cloud resource dependencies

---

## Future Enhancements

- [x] Add CI/CD pipeline for automated deployments
- [ ] Implement multi-environment support (dev/staging/prod)
- [ ] Add monitoring and alerting with CloudWatch
- [ ] Implement automated backups for RDS
- [ ] Implement Auto Scaling Groups (ASG) for potential traffic spikes

---

## Conclusion

This solution makes the infrastructure better equipped for making agile changes, introduces version control, a secure environment and a production ready solution that proves the ability to be modified and redeployed. Migrating to IaC with CDK benefits the company in many ways allowing:

- **Faster deployment cycles** through automated provisioning and consistent environments
- **Reduced human error** by eliminating manual configuration and ensuring repeatable deployments
- **Cost optimization** through infrastructure versioning that enables easy rollback and testing before production
- **Team collaboration** with infrastructure code that can be reviewed, tested, and approved like application code
- **Scalability** that supports future growth without requiring infrastructure redesign
- **Disaster recovery** capabilities through quick redeployment from version-controlled templates

This foundation positions the organization to rapidly innovate while maintaining security, compliance, and operational excellence.

---

## 🤝 Connect With Me

<p align="center">
  <a href="mailto:travondm2@gmail.com">
    <img src="https://img.shields.io/badge/EMAIL-TRAVONDM2%40GMAIL.COM-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/>
  </a>
  <a href="https://github.com/vonongit">
    <img src="https://img.shields.io/badge/GITHUB-VONONGIT-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <a href="https://www.linkedin.com/in/travon-mayo/">
    <img src="https://img.shields.io/badge/LINKEDIN-TRAVON%20MAYO-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
</p>

---

⭐ **If you found this project helpful, please consider giving it a star!**

*This was a learning project based on a real-world scenario from Cloud Engineer Academy.*