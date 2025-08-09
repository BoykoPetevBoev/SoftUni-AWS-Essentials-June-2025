import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyEvent } from "aws-lambda"

const dynamoDB = new DynamoDBClient

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(JSON.stringify(event))

    const tableName = process.env.TABLE_NAME
    const topicArn = process.env.TOPIC_ARN

    const putItemCommand = new PutItemCommand({
        Item: {
            PK: {
                S: "ORDER..."
            },
            SK: {
                S: "METADATA..."
            },
            randomNumber: {
                N: "4"
            },
            timestamp: {
                S: ""
            }
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: tableName
    })

    const clientresponse = await dynamoDB.send(putItemCommand)

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "OK"
        })
    }
}