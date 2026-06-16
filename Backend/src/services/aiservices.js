const { Mistral } =
require("@mistralai/mistralai");

const client =
new Mistral({
    apiKey: process.env.MISTRAL_API_KEY
});

exports.generateResponse =
async ({
    userMessage,
    pageContent,
    chatHistory
}) => {

    const prompt = `
Page Content:
${pageContent}

Recent Discussion:
${chatHistory}

User:
${userMessage}
`;

    const response =
        await client.chat.complete({
            model: "mistral-small-latest",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

    return response.choices[0]
        .message.content;
};