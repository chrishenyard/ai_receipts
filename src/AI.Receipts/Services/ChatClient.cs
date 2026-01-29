using OllamaSharp;
using OllamaSharp.Models.Chat;
using System.Text;

namespace AI.Receipts.Services;

public static class ChatClient
{
    public static async Task<string> GetChatResponseAsync(
        OllamaApiClient ollamaClient,
        ChatRequest chatRequest,
        CancellationToken cancellationToken)
    {
        var chatResponse = ollamaClient.ChatAsync(chatRequest, cancellationToken: cancellationToken);
        var message = new StringBuilder();

        await foreach (var response in chatResponse.ConfigureAwait(false))
        {
            var content = response?.Message?.Content;
            if (string.IsNullOrWhiteSpace(content))
            {
                continue;
            }
            message.Append(content);
        }

        return message.ToString()
            .Replace("```json", string.Empty, StringComparison.Ordinal)
            .Replace("```", string.Empty, StringComparison.Ordinal)
            .Trim();
    }
}
