import * as cdk from 'aws-cdk-lib'; // #CDK_Core_Import
import * as ec2 from 'aws-cdk-lib/aws-ec2'; // #EC2_Module_Import
import * as rds from 'aws-cdk-lib/aws-rds'; // #RDS_Module_Import
import * as iam from 'aws-cdk-lib/aws-iam'; // #IAM_Module_Import
import { Construct } from 'constructs'; // #Constructs_Import

export class TechHealthProjectStack extends cdk.Stack { // #Stack_Class_Definition
    constructor (scope: Construct, id: string, props?: cdk.StackProps) { // #Constructor_Declaration
        super(scope, id, props); // #Parent_Constructor_Call


// #VPC_Configuration
const vpc = new ec2.Vpc(this, 'TechHealthVpc', { // #Create_VPC
    maxAzs: 2, // #Two_Availability_Zones
    natGateways: 0, // #No_NAT_Gateways
    subnetConfiguration:[ // #Subnet_Config_Array
        {
            name: 'PublicSubnet', // #Public_Subnet_Name
            subnetType: ec2.SubnetType.PUBLIC, // #Public_Subnet_Type
            cidrMask: 24 // #CIDR_Mask_24
        },
        {
            name: 'PrivateSubnet', // #Private_Subnet_Name
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // #Isolated_Subnet_Type
            cidrMask: 24 // #CIDR_Mask_24
        }
    ]
});

// #EC2_Security_Group
const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', { // #Create_EC2_SG
    vpc: vpc, // #Associate_VPC
    description: 'Security group for EC2 web server', // #SG_Description
    allowAllOutbound: true // #Allow_All_Outbound
});

ec2SecurityGroup.addIngressRule( // #Add_HTTPS_Rule
    ec2.Peer.anyIpv4(), // #Allow_Any_IPv4
    ec2.Port.tcp(443), // #Port_443_HTTPS
    'Allow HTTPS traffic from internet' // #HTTPS_Rule_Description
);

ec2SecurityGroup.addIngressRule( // #Add_SSH_Rule
    ec2.Peer.ipv4('108.248.219.126/32'), // #Specific_IP_Address
    ec2.Port.tcp(22), // #Port_22_SSH
    'Allow SSH from my IP only' // #SSH_Rule_Description
);

// #RDS_Security_Group
const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', { // #Create_RDS_SG
    vpc: vpc, // #Associate_VPC
    description: 'Security group for new RDS MySQL', // #RDS_SG_Description
allowAllOutbound: false // #Block_All_Outbound
});

rdsSecurityGroup.addIngressRule( // #Add_MySQL_Rule
    ec2.Peer.securityGroupId(ec2SecurityGroup.securityGroupId), // #From_EC2_SG
    ec2.Port.tcp(3306), // #Port_3306_MySQL
    'Allow MySQL traffic from EC2' // #MySQL_Rule_Description
);

// #IAM_Role_Configuration
const ec2Role = new iam.Role(this, 'EC2Role', { // #Create_IAM_Role
    assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'), // #EC2_Service_Principal
    description: 'IAM role for EC2 to access RDS credentials, Cloudwatch logs, and SSM' // #Role_Description
});

// Service-to-service: EC2 → Secrets Manager (for RDS password)
ec2Role.addManagedPolicy( // #Add_Secrets_Policy
    iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite') // #Secrets_Manager_Access
);

// Monitoring: EC2 → CloudWatch
ec2Role.addManagedPolicy( // #Add_CloudWatch_Policy
    iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy') // #CloudWatch_Agent_Access
);

// Management: SSM → EC2
ec2Role.addManagedPolicy( // #Add_SSM_Policy
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore') // #SSM_Manager_Access
);

// #EC2_Instance
const ec2Instance = new ec2.Instance(this, 'WebServer', { // #Create_EC2_Instance
    vpc: vpc, // #Associate_VPC
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO), // #T2_Micro_Type
    machineImage: ec2.MachineImage.latestAmazonLinux2(), // #Amazon_Linux_2_AMI
    securityGroup: ec2SecurityGroup, // #Attach_EC2_SG
    role: ec2Role, // #Attach_IAM_Role
    vpcSubnets: { // #Subnet_Selection
        subnetType: ec2.SubnetType.PUBLIC, // #Launch_In_Public_Subnet
    }
});

// #RDS_Database_Instance
const rdsInstance = new rds.DatabaseInstance(this, 'PrivateDB', { // #Create_RDS_Instance
    vpc: vpc, // #Associate_VPC
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO), // #T3_Micro_Type
    engine: rds.DatabaseInstanceEngine.mysql({ // #MySQL_Engine
        version: rds.MysqlEngineVersion.VER_8_0 // #MySQL_8_0_Version
    }),
    credentials: rds.Credentials.fromGeneratedSecret('admin'), // #Generate_Admin_Credentials
    securityGroups: [rdsSecurityGroup], // #Attach_RDS_SG
        vpcSubnets: { // #Subnet_Selection
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED // #Launch_In_Private_Subnet
    }
  });

// #CloudFormation_Outputs
new cdk.CfnOutput(this, 'EC2PublicIP', { // #Output_EC2_IP
    value: ec2Instance.instancePublicIp, // #EC2_Public_IP_Value
    description: 'Public IP address of EC2 instance' // #EC2_IP_Description
});

new cdk.CfnOutput(this, 'RDSEndpoint', { // #Output_RDS_Endpoint
    value: rdsInstance.dbInstanceEndpointAddress, // #RDS_Endpoint_Value
    description: 'RDS database endpoint' // #RDS_Endpoint_Description
});

new cdk.CfnOutput(this, 'DatabaseSecretArn', { // #Output_Secret_ARN
    value: rdsInstance.secret?.secretArn || 'No secret created', // #Secret_ARN_Value
    description: 'ARN of the database secret in Secrets Manager' // #Secret_ARN_Description
});

    }
}