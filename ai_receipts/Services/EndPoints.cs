using ai_receipts.Settings;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models.Chat;
using System.Text;

namespace ai_receipts.Services;

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
            if (string.IsNullOrEmpty(request.ContentType) || !request.ContentType.StartsWith("image/"))
            {
                return Results.BadRequest("Please upload an image (image/jpeg, image/png)");
            }

            var ollamaSettings = options.Value;

            try
            {
                using var memoryStream = new MemoryStream();
                await request.Body.CopyToAsync(memoryStream, cancellationToken);
                var imageBytes = memoryStream.ToArray();
                var base64Image = Convert.ToBase64String(imageBytes);

                var chatRequest = new ChatRequest
                {
                    Model = ollamaSettings.VisionModel,
                    Messages =
                    [
                        new (ChatRole.System, "As a OCR reader, extract the entire text from the image as is."),
                        new()
                        {
                            Role = ChatRole.User,
                            Content = "Extract the text from the image without any additional information",
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
