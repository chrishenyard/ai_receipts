using AI.Receipts.Data;
using AI.Receipts.IO;
using AI.Receipts.Settings;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models.Chat;
using System.Text;
using System.Text.Json;

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
            [FromForm] IFormFile file,
            IFileSystem fileSystem,
            IOptions<OllamaSettings> options,
            IOptions<FileStorage> fileStorage,
            ILogger<EndPoints> logger,
            CancellationToken cancellationToken) =>
        {
            (bool flowControl, IResult value) = ValidateFileUpload(file, fileStorage);
            if (!flowControl)
            {
                return value;
            }

            var ollamaSettings = options.Value;
            var ocrSystemPrompt = await System.IO.File.ReadAllTextAsync("Prompts/OCRSystemPrompt.txt", cancellationToken);

            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream, cancellationToken);
                var imageBytes = memoryStream.ToArray();
                var filePath = await fileSystem.SaveAsync(file.FileName, imageBytes, cancellationToken);

                logger.LogInformation("Processing receipt image, size: {Size} bytes, saved to: {Path}", imageBytes.Length, filePath);

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
                            Content = "Analyze this receipt image and extract the information according to the system instructions. Return only valid JSON.",
                            Images = [base64Image]
                        }
                    ],
                    Stream = true,
                    Format = "json"
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

                // Clean up the output - remove markdown code blocks if present
                output = output.Replace("```json", "").Replace("```", "").Trim();

                logger.LogInformation("Successfully extracted text, length: {Length} characters", output.Length);
                logger.LogDebug("Extracted JSON: {Json}", output);

                // Validate JSON
                try
                {
                    using var jsonDoc = JsonDocument.Parse(output);
                    return Results.Content(output, "application/json", Encoding.UTF8);
                }
                catch (JsonException jsonEx)
                {
                    logger.LogError(jsonEx, "Invalid JSON returned from Ollama: {Output}", output);
                    return Results.Problem("The extracted data is not valid JSON",
                        statusCode: StatusCodes.Status500InternalServerError);
                }
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

        app.MapGet("/generate-token", (IAntiforgery antiforgery, HttpContext httpContext) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(httpContext);
            return Results.Ok(new { token = tokens.RequestToken });
        });
    }

    private static (bool flowControl, IResult value) ValidateFileUpload(IFormFile file, IOptions<FileStorage> fileStorage)
    {
        var fileStorageSettings = fileStorage.Value;

        if (file == null || file.Length == 0)
        {
            return (flowControl: false, value: Results.BadRequest("No file was uploaded."));
        }

        if (string.IsNullOrEmpty(file.ContentType) ||
            !IO.File.SupportedImageTypes.Contains(file.ContentType))
        {
            return (flowControl: false, value: Results.BadRequest("Please upload an image, ex (image/jpeg, image/png)"));
        }

        if (file.Length > fileStorageSettings.MaxFileSizeBytes)
        {
            return (flowControl: false, value: Results.BadRequest($"The uploaded file exceeds the maximum allowed size of {fileStorageSettings.MaxFileSizeBytes} bytes."));
        }

        return (flowControl: true, value: Results.Ok());
    }
}
