import { RemovalPolicy, Stack, StackProps, App } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface MyCdkStackProps extends StackProps {
  stackName: 'blue' | 'green'
  deploymentEnvironment: 'blue' | 'green';
}

//begin stack definition
export class FirstCdkAppStack extends Stack {
  constructor(scope: App, id: string, props: MyCdkStackProps) {
    super(scope, id, props);

    //define dynamodb table
    const dynamodb_table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
      }
    )

    //define lambda function and reference function file
    const lambda_backend = new NodejsFunction(this, "function", {
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        DYNAMODB: dynamodb_table.tableName
      },
      runtime: lambda.Runtime.NODEJS_14_X
    })

    //define lambda function to add item
    const add_item_lambda_backend = new NodejsFunction(this, "add-item", {
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        DYNAMODB: dynamodb_table.tableName
      },
      runtime: lambda.Runtime.NODEJS_14_X
    })

    //grant lambda function read access to dynamodb table
    dynamodb_table.grantReadData(lambda_backend.role!)

    //grant lambda function write access to dynamodb table
    dynamodb_table.grantWriteData(add_item_lambda_backend.role!)

    //define apigateway
    const api = new apigateway.RestApi(this, "RestAPI", {
      deployOptions: {
        dataTraceEnabled: true,
        tracingEnabled: true
      },
    })

    //define endpoint and associate it with lambda backend
    const scanEndpoint = api.root.addResource("scan")
    const scanEndpointMethod = scanEndpoint.addMethod("GET", new apigateway.LambdaIntegration(lambda_backend))

    const addItemEndpoint = api.root.addResource("add")
    const addItemEndpointMethod = addItemEndpoint.addMethod("PUT", new apigateway.LambdaIntegration(add_item_lambda_backend))
  }
}
