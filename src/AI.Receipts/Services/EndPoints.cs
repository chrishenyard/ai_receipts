using AI.Receipts.Data;
using AI.Receipts.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models.Chat;
using System.Text;

namespace AI.Receipts.Services;

public class EndPoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/", () => "AI Receipts is running...");

        app.MapGet("/debug/config", (IOptions<OllamaSettings> options) =>
        {
            var settings = options.Value;
            return Results.Ok(new
            {
                OllamaUrl = settings.Url,
                settings.VisionModel,
                TimeoutMinutes = settings.TimeoutFromMinutes
            });
        });

        app.MapGet("/debug/connection", async (
            IHttpClientFactory httpClientFactory,
            IOptions<OllamaSettings> options,
            ILogger<EndPoints> logger) =>
        {
            try
            {
                var httpClient = httpClientFactory.CreateClient("ollama");
                logger.LogInformation("Testing connection to Ollama at {BaseAddress}", httpClient.BaseAddress);

                var response = await httpClient.GetAsync("/api/tags");
                var content = await response.Content.ReadAsStringAsync();

                return Results.Ok(new
                {
                    StatusCode = (int)response.StatusCode,
                    IsSuccess = response.IsSuccessStatusCode,
                    Content = content,
                    BaseAddress = httpClient.BaseAddress?.ToString()
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to connect to Ollama");
                return Results.Problem($"Connection failed: {ex.Message}", statusCode: 503);
            }
        });

        app.MapGet("/health/ollama", async (
            OllamaApiClient ollamaClient,
            ILogger<EndPoints> logger,
            IOptions<OllamaSettings> options) =>
        {
            try
            {
                logger.LogInformation("Checking Ollama health at {Url}", options.Value.Url);
                var models = await ollamaClient.ListLocalModelsAsync();
                return Results.Ok(new { status = "healthy", models = models.Select(m => m.Name) });
            }
            catch (HttpRequestException ex)
            {
                logger.LogError(ex, "Ollama HTTP request failed");
                return Results.Problem($"Ollama service unavailable: {ex.Message}", statusCode: 503);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Ollama health check failed");
                return Results.Problem($"Ollama service unavailable: {ex.Message}", statusCode: 503);
            }
        });

        app.MapPost("/api/receipt", async (
            HttpRequest request,
            OllamaApiClient ollamaClient,
            IFormFile file,
            IOptions<OllamaSettings> options,
            ILogger<EndPoints> logger,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrEmpty(file.ContentType) ||
                !IO.File.SupportedImageTypes.Contains(file.ContentType))
            {
                return Results.BadRequest("Please upload an image, ex (image/jpeg, image/png)");
            }

            var ollamaSettings = options.Value;
            var ocrSystemPrompt = await System.IO.File.ReadAllTextAsync("Prompts/OCRSystemPrompt.txt", cancellationToken);

            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream, cancellationToken);
                var imageBytes = memoryStream.ToArray();

                logger.LogInformation("Processing receipt image, size: {Size} bytes", imageBytes.Length);

                var base64Image = Convert.ToBase64String(imageBytes);

                logger.LogInformation("Sending request to Ollama at {Url} with model: {Model}", ollamaSettings.Url, ollamaSettings.VisionModel);

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
                    message.Append(response?.Message?.Content);
                }

                var output = message.ToString().Trim();

                if (string.IsNullOrEmpty(output))
                {
                    logger.LogWarning("No text extracted from the image");
                    return Results.Problem("No text extracted from the image",
                        statusCode: StatusCodes.Status500InternalServerError);
                }

                logger.LogInformation("Successfully extracted text, length: {Length} characters", output.Length);
                return Results.Text(output, "text/plain", Encoding.UTF8);
            }
            catch (HttpRequestException ex)
            {
                logger.LogError(ex, "HTTP error connecting to Ollama at {Url}. StatusCode: {StatusCode}",
                    ollamaSettings.Url, ex.StatusCode);
                return Results.Problem($"Failed to connect to Ollama service: {ex.Message}",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            catch (TaskCanceledException ex)
            {
                logger.LogError(ex, "Request to Ollama timed out after {Timeout} minutes", ollamaSettings.TimeoutFromMinutes);
                return Results.Problem("Request to Ollama timed out",
                    statusCode: StatusCodes.Status504GatewayTimeout);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing receipt. Exception type: {Type}", ex.GetType().Name);
                return Results.Problem($"An error occurred processing receipt: {ex.Message}",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
        });

        app.MapGet("/api/Categories", async (AiReceiptsDbContext context) =>
        {
            var categories = await context.Categories.ToListAsync();
            return Results.Ok(categories);
        });
    }
}
