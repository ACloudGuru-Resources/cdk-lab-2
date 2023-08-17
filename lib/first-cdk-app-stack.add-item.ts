import * as AWSXRay from 'aws-xray-sdk';
import * as AWSSDK from 'aws-sdk';
import {APIGatewayProxyEvent} from "aws-lambda";

//define DocumentClient
const AWS = AWSXRay.captureAWS(AWSSDK);
const docClient = new AWS.DynamoDB.DocumentClient();

//define table by variable passed from stack
const table = process.env.DYNAMODB || "undefined"

async function putItem(params: any) {
  return docClient.put(params).promise()
}

//actual handler logs events and calls scanItems
//logs error on catch
exports.handler = async (event: APIGatewayProxyEvent) => {
  try {
    console.log(event)
    console.log(event.body)
    let obj
    if (event.body != null) {
      obj = JSON.parse(event.body)
    } else {
      return {error: 'No body supplied'}
    }

    const ID = obj.id;
    const NAME = obj.name

    const params = {
      TableName: table,
      Item: {
        id: ID,
        name: NAME
      }
    };

    const data = await putItem(params)
    return {body: JSON.stringify(data)}
  } catch (err) {
    return {error: err}
  }
}
