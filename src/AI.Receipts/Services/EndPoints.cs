using AI.Receipts.Settings;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models.Chat;
using System.Buffers;
using System.Text;

namespace AI.Receipts.Services;

public class EndPoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/", () => "AI Receipts is running...");

        app.MapPost("/receipt", async (
            HttpRequest request,
            OllamaApiClient ollamaClient,
            IOptions<OllamaSettings> options,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrEmpty(request.ContentType) ||
                !IO.File.SupportedImageTypes.Contains(request.ContentType))
            {
                return Results.BadRequest("Please upload an image, ex (image/jpeg, image/png)");
            }

            var ollamaSettings = options.Value;
            var ocrSystemPrompt = IO.File.ReadTextFromFile("Prompts/OCRSystemPrompt.txt");

            try
            {
                var contentLength = (int)(request.ContentLength ?? 0);
                var buffer = ArrayPool<byte>.Shared.Rent(contentLength);

                try
                {
                    var bytesRead = await request.Body.ReadAsync(buffer.AsMemory(0, contentLength), cancellationToken);
                    var base64Image = Convert.ToBase64String(buffer, 0, bytesRead);

                    var chatRequest = new ChatRequest
                    {
                        Model = ollamaSettings.VisionModel,
                        Messages =
                        [
                            new (ChatRole.System, ocrSystemPrompt),
                            new()
                            {
                                Role = ChatRole.User,
                                Content = "Extract text from this image according to the system instructions.",
                                Images = [base64Image]
                            }
                        ],
                        Stream = true
                    };

                    var chatResponse = ollamaClient.ChatAsync(chatRequest, cancellationToken: cancellationToken);

                    var message = new StringBuilder();
                    await foreach (var response in chatResponse)
                    {
                        if (string.IsNullOrEmpty(response?.Message?.Content))
                        {
                            continue;
                        }
                        message.AppendLine(response?.Message?.Content);
                    }

                    var output = message.ToString().Trim();

                    if (string.IsNullOrEmpty(output))
                    {
                        return Results.Problem("No text extracted from the image",
                            statusCode: StatusCodes.Status500InternalServerError);
                    }

                    return Results.Text(output, "text/plain", Encoding.UTF8);
                }
                finally
                {
                    ArrayPool<byte>.Shared.Return(buffer);
                }
            }
            catch (Exception ex)
            {
                app.Logger.LogError(ex, "Error processing receipt");
                return Results
                    .Problem("An error occurred processing receipt",
                        statusCode: StatusCodes.Status500InternalServerError);
            }
        });
    }
}
