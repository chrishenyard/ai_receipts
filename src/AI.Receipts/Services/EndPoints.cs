using AI.Receipts.Data;
using AI.Receipts.IO;
using AI.Receipts.Models;
using AI.Receipts.Serializers;
using AI.Receipts.Settings;
using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models;
using OllamaSharp.Models.Chat;
using System.Text;

namespace AI.Receipts.Services;

public class EndPoints
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/", () => "AI Receipts is running...");

        // Antiforgery token endpoint - sets cookie automatically
        app.MapGet("/api/antiforgery/token", (IAntiforgery antiforgery, HttpContext context) =>
        {
            var tokens = antiforgery.GetAndStoreTokens(context);
            context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!,
                new CookieOptions
                {
                    HttpOnly = false, // Allow JavaScript to read
                    Secure = context.Request.IsHttps,
                    SameSite = SameSiteMode.Strict
                });
            return Results.Ok(new { });
        });

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
        });

        app.MapGet("/health/ollama", async (
            OllamaApiClient ollamaClient,
            ILogger<EndPoints> logger,
            IOptions<OllamaSettings> options) =>
        {
            logger.LogInformation("Checking Ollama health at {Url}", options.Value.Url);
            var models = await ollamaClient.ListLocalModelsAsync();
            return Results.Ok(new { status = "healthy", models = models.Select(m => m.Name) });
        });

        app.MapPost("/api/receipt", async (
            HttpRequest request,
            AiReceiptsDbContext context,
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
            var ocrUserPrompt = await System.IO.File.ReadAllTextAsync("Prompts/OCRUserPrompt.txt", cancellationToken);

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream, cancellationToken);
            var imageBytes = memoryStream.ToArray();
            var filePath = await fileSystem.SaveAsync(file.FileName, imageBytes, cancellationToken);

            logger.LogInformation("Processing receipt image, size: {Size} bytes, saved to: {Path}", imageBytes.Length, filePath);

            var base64Image = Convert.ToBase64String(imageBytes);

            logger.LogInformation("Sending request to Ollama at {Url} with model: {Model}", ollamaSettings.Url, ollamaSettings.VisionModel);

            var requestOptions = new RequestOptions
            {
                NumCtx = ollamaSettings.ContextWindowSize
            };

            var chatRequest = new ChatRequest
            {
                Model = ollamaSettings.VisionModel,
                Messages =
                [
                    new (ChatRole.System, ocrSystemPrompt),
                        new()
                        {
                            Role = ChatRole.User,
                            Content = ocrUserPrompt,
                            Images = [base64Image]
                        }
                ],
                Stream = true,
                Format = "json",
                Options = requestOptions
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

            _ = Json.TryDeserialize(output, out Receipt? receipt);
            if (receipt == null)
            {
                logger.LogInformation("Invalid JSON returned from Ollama: {Output}", output);
                return Results.Problem("The extracted data is not valid JSON",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            receipt.ImageUrl = filePath;
            context.Receipts.Add(receipt);
            await context.SaveChangesAsync(cancellationToken);
            return Results.Json(receipt);
        });

        app.MapGet("/api/Categories", async (AiReceiptsDbContext context) =>
        {
            var categories = await context.Categories.ToListAsync();
            return Results.Ok(categories);
        });

        app.MapPost("/api/receipt/create", async (
            [FromBody] Receipt receipt,
            AiReceiptsDbContext context,
            IValidator<Receipt> validator,
            ILogger<EndPoints> logger,
            CancellationToken cancellationToken) =>
        {
            var validationResult = await validator.ValidateAsync(receipt, cancellationToken);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage);
                return Results.BadRequest(new { Errors = errors });
            }

            receipt.CreatedAt = DateTime.UtcNow;
            receipt.UpdatedAt = DateTime.UtcNow;

            var categoryExists = await context.Categories
                .AnyAsync(c => c.CategoryId == receipt.CategoryId, cancellationToken);

            if (!categoryExists && receipt.CategoryId != 0)
            {
                return Results.BadRequest($"Category with ID {receipt.CategoryId} does not exist");
            }

            await context.Receipts
                .Where(r => r.ReceiptId == receipt.ReceiptId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(r => r.ExtractedText, receipt.ExtractedText)
                    .SetProperty(r => r.Title, receipt.Title)
                    .SetProperty(r => r.Description, receipt.Description)
                    .SetProperty(r => r.Vendor, receipt.Vendor)
                    .SetProperty(r => r.State, receipt.State)
                    .SetProperty(r => r.City, receipt.City)
                    .SetProperty(r => r.Country, receipt.Country)
                    .SetProperty(r => r.Tax, receipt.Tax)
                    .SetProperty(r => r.Total, receipt.Total)
                    .SetProperty(r => r.PurchaseDate, receipt.PurchaseDate)
                    .SetProperty(r => r.UpdatedAt, DateTime.UtcNow)
                    .SetProperty(r => r.CategoryId, receipt.CategoryId),
                    cancellationToken: cancellationToken);

            logger.LogInformation("Receipt saved successfully with ID: {ReceiptId}", receipt.ReceiptId);
            return Results.Created($"/api/receipts/{receipt.ReceiptId}", receipt);
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
