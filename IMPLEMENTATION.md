# TechHealth Infrastructure Implementation Journey

## Table of Contents
1. [Project Context](#project-context)
2. [Initial Setup & Planning](#initial-setup--planning)
3. [Implementation Phase](#implementation-phase)
4. [Challenges & Solutions](#challenges--solutions)
5. [Testing & Validation](#testing--validation)
6. [Key Learnings](#key-learnings)
7. [Final Thoughts](#final-thoughts)

---

## Project Context
Transitioning from manual AWS Console infrastructure to IaC using CDK with TypeScript

## Initial Setup & Planning

### Technology Decisions
**Why CDK over CloudFormation or Terraform?**
- This was a personal decision for me, I am most comfortable with Terraform because it is cloud agnostic meaning it can be used for multiple cloud providers. I have less experience with CDK, but learning its benefits with CloudFormation Stacks encouraged me to expand my hand on skills.

**Why TypeScript over Python/other languages?**
- ### Why TypeScript Over Python?

I chose TypeScript for its compile-time type checking, which catches errors before deployment. Coming from Terraform, I made several syntax mistakes during development (like `ec2.peer` vs `ec2.Peer` - capitalization matters in TypeScript). The TypeScript compiler caught these immediately, whereas Python would have failed during CDK synthesis or deployment, wasting time and AWS resources.

**Trade-off:** Python's simpler syntax would have been faster to write initially, but TypeScript's safety net proved valuable for infrastructure code where mistakes have real consequences. The strong IDE support (autocomplete, inline documentation) also accelerated my learning of CDK constructs.

**Future Plans:** I plan to implement variations of this project using Python to compare the development experience and deepen my understanding of both approaches.

### Architecture Design Decisions

![alt text](Architecture_Diagram.png)

**VPC Design:**
- Chose 2 AZs for high availability while keeping costs reasonable for portfolio project
- Created Public subnets to host the public user facing application
- Decided on isolated private subnets (no NAT GW) to minimize costs since RDS doesn't need internet access
- CDK is smart enough to create the IGW on its own and understand what routes should be created for route tables

**Security Approach:**
- Implemented least-privilege security groups
- Restricted SSH to personal IP only
- Only allowed secure tcp traffic in the sg for public users to access the EC2
- Only allowed MySQL traffic in the sg to access the RDS

---

## Implementation Phase

### Phase 1: VPC & Networking

**Thought Proccess**
- Specified 2 AZs to achieve high availability and withstand disasters
- No NAT gateways to reduce cost. NAT gateways are meant to expose private resources to the public, We do not want the DB to be publicly accessible so that reduces cost and secures our DB.
- Defined 1 Public Subnet and 1 Private Subnet, each AZ will have their own

**Code Snippet:**
![alt text](image.png)

**Decision Point: Realized CDK automatically creates Internet Gateway...**
In terraform you have to create/define the IGW yourself, one of the benefits of CDK is CDK automatically handles the IGW for you. Typically you want to double check any automatic/default resources due to security reasons, but IGW is not providing access to resources, it is simply a way into the vpc.

### Phase 2: Security Groups
**EC2 Security Group:**
Configured two ingress rules to balance accessibility with security:
- **HTTPS (port 443)** from anywhere (0.0.0.0/0) - allows patients to access the web portal
- **SSH (port 22)** from my IP only (108.248.219.126/32) - enables secure administrative access for testing and management

**Decision Point:** Initially considered allowing SSH from anywhere, but restricted it to my specific IP following the principle of least privilege. This demonstrates proper security practices for production environments.

TechHealth-Project/Screenshots/EC2_SecurityGroups.png

**RDS Security Group:**
Implemented defense-in-depth by isolating the database layer:
- **Ingress:** MySQL traffic (port 3306) only from the EC2 Security Group - ensures only the application tier can access the database
- **Egress:** Disabled all outbound traffic (`allowAllOutbound: false`) - RDS doesn't need to initiate external connections

![alt text](image-6.png)

**Security Benefit:** Even if the EC2 instance were compromised, the attacker could only access RDS via the MySQL protocol. The database has no internet access and cannot be reached directly from the public internet.

### Phase 3: IAM Roles & Policies
**Why These Specific Policies?**
- CloudWatchAgentServerPolicy: For logging and monitoring
- SecretsManagerReadWrite: For EC2 to retrieve RDS credentials
- AmazonSSMManagedInstanceCore: For keyless, secure access

![alt text](image-7.png)

---

## Challenges & Solutions

### Challenge 1: CDK Project Structure
**The Problem:**
I initially had just TypeScript files without understanding CDK requires a specific project structure beyond just the stack code. I had created `cdk-main.ts` and `cdk-outputs.ts` files, but was missing the configuration and dependency files that CDK needs to actually run.

**What Went Wrong:**
When I tried to run `cdk deploy`, I got this error:
```bash
--app is required either in command-line, in cdk.json or in ~/.cdk.json
```

**What I Was Missing:**
CDK projects require several components beyond just TypeScript code:
1. **`cdk.json`** - Configuration file that tells CDK how to execute your app
2. **`package.json`** - Defines project dependencies and scripts
3. **`tsconfig.json`** - TypeScript compiler configuration
4. **Proper directory structure:**
   - `bin/` - Application entry point that instantiates your stack
   - `lib/` - Where your stack definitions live
   - `node_modules/` - Installed dependencies

**Investigation Process:**
- Realized I was missing CDK configuration files
- Learned about cdk.json and its role
- Discovered `cdk init` command

**The Solution:**
Used `cdk init app --language typescript` to generate proper project structure
- All necessary configuration files
- Proper directory layout
- Sample stack code that I could replace with my implementation

**What I Learned:**
CDK projects need more than just code - they require correct configuration

### Challenge 2: Bootstrap Stack Failure
**The Problem:**
When attempting to bootstrap my AWS environment for CDK, the process failed due to a conflict with an existing S3 bucket from a previous bootstrap attempt.

**What Went Wrong:**
Running `cdk bootstrap` resulted in this error:
```bash
❌ Environment aws://533931877449/us-east-1 failed bootstrapping: 
Resource handler returned message: "cdk-hnb659fds-assets-533931877449-us-east-1 already exists"
The stack named CDKToolkit failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE
```

**Understanding the Issue:**
CDK's bootstrap process creates a CloudFormation stack called `CDKToolkit` which includes:
- An S3 bucket for storing deployment assets
- IAM roles for CDK operations
- Other infrastructure needed for deployments

The bootstrap had partially failed in a previous attempt, leaving the S3 bucket behind but putting the CloudFormation stack in a `ROLLBACK_COMPLETE` state. When I tried to bootstrap again, CloudFormation attempted to create a new S3 bucket with the same name, which AWS doesn't allow since bucket names are globally unique.

**Investigation Process:**
1. Checked the AWS Console CloudFormation section
2. Found the `CDKToolkit` stack in `ROLLBACK_COMPLETE` status
3. Realized the failed stack was blocking a new bootstrap attempt
4. Learned that failed CloudFormation stacks need manual cleanup

**The Solution:**
Deleted the failed CDKToolkit stack from AWS Console (or could have used CLI):
```bash
aws cloudformation delete-stack --stack-name CDKToolkit
```

Waited 1-2 minutes for deletion to complete, then successfully ran:
```bash
cdk bootstrap
✅ Environment aws://533931877449/us-east-1 bootstrapped.

![alt text](image-8.png)

```

**What I Learned:**
- CloudFormation stacks can fail and leave resources behind in inconsistent states
- The `ROLLBACK_COMPLETE` status means the stack failed and rolled back, but the stack itself still exists
- Failed stacks must be cleaned up before retrying operations
- Bootstrap is a one-time setup per account/region, but failed attempts require manual intervention

### Challenge 3: TypeScript Syntax Learning Curve
**Coming from Terraform:**
As stated earlier I am used to Terraform syntax, I decided to think of the CDK in Terraform terms. Although written differently, the same resources/parameters are being defined in the code.

**TypeScript Differences:**
- Case sensitivity (ec2.(P)eer vs ec2.(p)eer)
- Object syntax with colons not equals
- Indentation works differently for each line of code

**Specific Errors I Hit:**
- Capitolization:
```typescript
// ❌ Wrong
ec2.(p)eer.ipv4('...')

// ✅ Correct  
ec2.(P)eer.ipv4('...')
```

**What I Learned:**
I learned that although the code is written differently, the syntax and overall code has the same purpose to create the infrastructure. Typescript with CDK is valueable option as it will help you catch syntax errors before deplyement. I also learned that CDK with Typescript is more similar to Terraform than I originally thought.

---

## Testing & Validation

### Deployment Process

**Pre-Deployment Synthesis:**
Before deployment, CDK synthesized the CloudFormation template, which took about 2.6 seconds. During this phase, CDK built custom resources like the VPC default security group handler and published assets to S3.

![alt text](image-9.png) 


**Security Review Prompt:**
CDK displayed a comprehensive preview of changes before deployment, showing:
- **IAM Statement Changes:** New roles for EC2 and Lambda
- **IAM Policy Changes:** Three managed policies being attached to EC2Role
  - SecretsManagerReadWrite
  - CloudWatchAgentServerPolicy  
  - AmazonSSMManagedInstanceCore
- **Security Group Changes:** 
  - EC2 Security Group with HTTPS (443) from anywhere and SSH (22) from my IP
  - RDS Security Group allowing MySQL (3306) only from EC2

CDK prompted: `"--require-approval" is enabled and stack includes security-sensitive updates: 'Do you wish to deploy these changes' (y/n)`

This review step demonstrates AWS best practices - requiring explicit approval before deploying infrastructure with security implications.

![alt text](image-11.png)

**Deployment Execution:**
After confirming with 'y', CloudFormation began creating resources. The deployment took approximately **9 minutes (554 seconds)**, with most of that time spent provisioning the RDS database instance.

**Successful Outputs:**
The deployment completed successfully with three CloudFormation outputs:
```bash
TechHealthProjectStack.EC2PublicIP = 52.206.106.6
TechHealthProjectStack.RDSEndpoint = techhealthprojectstack-privatedba34df42a-nugu0zshpuwx.c29yw6qc0sfh.us-east-1.rds.amazonaws.com
TechHealthProjectStack.DatabaseSecretArn = arn:aws:secretsmanager:us-east-1:533931877449:secret:TechHealthProjectStackPriva-OwHzMCVKbti6-fKVIIm
```

**Observation:**
The RDS endpoint's random suffix (`nugu0zshpuwx`) and the Secret ARN's unique identifier demonstrate AWS's approach to ensuring unique resource names. These outputs proved essential for the testing phase - without them, I would have needed to manually locate each resource in the AWS Console.

**What Went Right:**
- All 30+ resources created successfully on first deployment attempt (after fixing code issues)
- No rollback or failures during deployment
- Clear visibility into what was being created before confirmation
- Immediate access to critical connection information via outputs

### Connectivity Testing
**Challenge: How to Access EC2 Without SSH Keys**
- After successful deployment the first task was to connect to the EC2 instance. The challenge is to find a way to connect to the instance without SSH keys.

**SSM Session Manager:**
Typically SSH keys would be required to connect to the RDS instance, however we created an IAM role for 'Systems Manager' (SSM) which allows connection to the EC2 instance without the need of SSH key.

![alt text](image-12.png)

To connect to the database we must first retireve the Database password as this is a requirement for connecting to the database. To connect, we use the command 'aws secretmanager get-secret-value'

![alt text](image-14.png)

**MySQL Connection Test:**
As mentioned earlier for our Security Groups, we stated that the only traffic allowed to reach the RDS DB is MySQL traffic originating from the EC2 instance. Once connected, we prove connection to the EC2 with commands such as 'Show Databases' which outputs 'information_schema: mysql', 'Show Version' that outputs 'Version 8.0.42' and 'Select Now' that outputs the current date and time, which at the time was '2025-10-30 03:39:26'.

![alt text](image-16.png)

---

## Decided to Add CI/CD pipeline

### CI/CD Overview
- CI/CD pipeline provides consitent benefits to ensuring no updates to our IAC is broken. This prevents a multitude of issues that can break the infrastructure. CI/CD is a best practice used in real world projects to avoid costly issues that can ruin infrastructure. For my implementation of the CI/CD pipeline, I will utilize github actions to ensure that any push to the repository goes through 2 phases of validating code, and automatically deploying to AWS.

# Setup Process
1. **Add AWS credentials to the github repository**
  a. Go to GitHub repo
  b. Click Settings → Secrets and variables → Actions
  c. Click New repository secret
  d. Add the following secrets:
  Name: AWS_ACCESS_KEY_ID
  Value: <AWS access key>

  Name: AWS_SECRET_ACCESS_KEY  
  Value: <AWS secret key>

  Name: AWS_REGION
  Value: <AWS region>

2. **CREATE A SIMPLE FILE: .github/workflows/deploy.yml**
name: Deploy Infrastructure

# Run this workflow when you push code
on:
  push:
    branches: [ main ] 

jobs: 
  deploy:
    runs-on: ubuntu-latest 
    
    steps: 
      # Get your code 
      - uses: actions/checkout@v4 
      
      # Install Node.js
      - uses: actions/setup-node@v4 
        with:
          node-version: '18' 
      
      # Install your project dependencies
      - run: npm install 
      
      # Check if CDK code is valid
      - run: npm run cdk synth 
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1
      
      # Deploy to AWS
      - run: npm run cdk deploy -- --require-approval never 
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1

# Push to github
3. **Push code to github**
git add .
git commit -m "Add CI/CD pipeline"
git push origin main

## Testing deployment with CI/CD Implemented


## Key Learnings

### Technical Learnings
1. **CDK Abstractions vs Terraform:** CDK provides higher-level constructs (Lvl 1, 2 and 3).
2. **TypeScript for Infrastructure:** Type safety caught several errors pror to deployment.
3. **AWS Best Practices:** Learned about SSM Session Manager, Secrets Manager to grant Role Base Acess Controls (RBAC) that guarantees least privelige.

### Process Learnings  
1. **Documentation is Critical:** Ensured that I documented the errors that occurred as it helps me document the fixes to those error for future work, it also records the process of getting the desired end result.
2. **Reading Error Messages:** Learned how to carefully identify some key syntax errors before attempting to deploy the infrastructure. I specifically learned that capitolization must be correct within constructs to keep the infrastructure suitable for deployment.
3. **Iterative Development:** Breaking down the problem into multiple sections int the order of VPC → Security → EC2 → RDS. Following this format allows each section to recieve complete focus before moving on to ensure best practices from beginning to end. Following the order of Networking → Security → Resources is an effective workflow to follow.

### What I'd Do Differently
- Start with `cdk init` from the beginning
- Set up AWS CLI region configuration earlier
- Review syntax for capitolization

---

## Final Thoughts

This project showed me that the AWS CDK has many benefits compared to Terraform...

**Portfolio Value:**
This implementation demonstrates:
- Cloud architecture design
- Security best practices
- Problem-solving ability
- Learning agility when facing less familiar tools

**Next Steps:**
If I were to expand this project, I would:
- Add automated testing with CDK assertions
- Implement CI/CD pipeline
- Add monitoring dashboards
- Re-write IAC with Lvl 1, 2 constructs