const snsClient = new SNSClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log(JSON.stringify(event))

    const topicArn = process.env.TOPIC_ARN;
    const data = event.detail

    await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: 'Retake Exam',
        Message: JSON.stringify(data),
    }));
}