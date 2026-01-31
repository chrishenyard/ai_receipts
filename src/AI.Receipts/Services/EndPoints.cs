using AI.Receipts.Data;
using AI.Receipts.IO;
using AI.Receipts.Models;
using AI.Receipts.Serializers;
using AI.Receipts.Settings;
using AI.Receipts.Utils;
using FluentValidation;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models;
using OllamaSharp.Models.Chat;
using System.Diagnostics;
using System.Text.Json;

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

        app.MapGet("/api/receipts", async (
            AiReceiptsDbContext context) =>
        {
            var receipts = await context.Receipts
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Results.Json(receipts);
        });

        app.MapPost("/api/receipt/update", async (
            Receipt receipt,
            AiReceiptsDbContext context,
            IValidator<Receipt> validator) =>
        {
            var validationResult = await validator.ValidateAsync(receipt);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage);
                return Results.BadRequest(new { Errors = errors });
            }

            receipt.UpdatedAt = DateTime.UtcNow;
            context.Receipts.Update(receipt);
            await context.SaveChangesAsync();

            return Results.Json(receipt);
        });

        app.MapDelete("/api/receipt/delete/{receiptId}", async (
            int receiptId,
            AiReceiptsDbContext context) =>
        {
            var receipt = await context.Receipts
                .Where(r => r.ReceiptId == receiptId)
                .FirstOrDefaultAsync();

            if (receipt == null)
            {
                return Results.NotFound($"Receipt with ID {receiptId} not found.");
            }

            context.Receipts.Remove(receipt);
            await context.SaveChangesAsync();

            return Results.Ok($"Receipt with ID {receiptId} deleted successfully.");
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
            // return a valid Receipt in JSON format to circumvent this method for testing
            //var testReceiptJson = new Receipt
            //{
            //    ExtractedText = "Test extracted text",
            //    Title = "Test Receipt",
            //    Description = "This is a test receipt.",
            //    Vendor = "Test Vendor",
            //    State = "Test State",
            //    City = "Test City",
            //    Country = "Test Country",
            //    Tax = 1.23m,
            //    Total = 12.34m,
            //    PurchaseDate = DateTime.UtcNow,
            //    CategoryId = 1
            //};

            //return Results.Json(testReceiptJson);

            (bool flowControl, IResult value) = ValidateFileUpload(file, fileStorage);
            if (!flowControl)
            {
                return value;
            }

            var ollamaSettings = options.Value;

            var promptReadTasks = new[]
            {
                System.IO.File.ReadAllTextAsync("Prompts/OCRSystemPrompt.txt", cancellationToken),
                System.IO.File.ReadAllTextAsync("Prompts/OCRUserPrompt.txt", cancellationToken)
            };
            var prompts = await Task.WhenAll(promptReadTasks);
            var ocrSystemPrompt = prompts[0];
            var ocrUserPrompt = prompts[1];

            using var memoryStream = new MemoryStream((int)file.Length);
            await file.CopyToAsync(memoryStream, cancellationToken);
            var imageBytes = memoryStream.ToArray();

            var filePath = await fileSystem.SaveAsync(file.FileName, imageBytes, cancellationToken);
            var base64Image = Convert.ToBase64String(imageBytes);

            logger.LogDebug("Processing receipt image, size: {Size} bytes, saved to: {Path}", imageBytes.Length, filePath);
            logger.LogDebug("Sending request to Ollama at {Url} with model: {Model}", ollamaSettings.Url, ollamaSettings.VisionModel);

            var requestOptions = new RequestOptions
            {
                NumCtx = ollamaSettings.ContextWindowSize,
                Temperature = ollamaSettings.Temperature
            };

            var chatRequest = new ChatRequest
            {
                Model = ollamaSettings.VisionModel,
                Messages =
                [
                    new (ChatRole.System, ocrSystemPrompt),
                    new ()
                    {
                        Role = ChatRole.System,
                        Content = ocrUserPrompt,
                        Images = [base64Image]
                    }
                ],
                Stream = true,
                Format = "json",
                Options = requestOptions
            };

            var sw = Stopwatch.StartNew();

            logger.LogInformation("Starting Ollama ChatAsync at {UtcNow}", DateTime.Now);

            var output = await ChatClient.GetChatResponseAsync(ollamaClient, chatRequest, cancellationToken);

            sw.Stop();
            logger.LogInformation("Completed Ollama chat in {ElapsedMs} ms", sw.ElapsedMilliseconds);

            if (string.IsNullOrEmpty(output))
            {
                logger.LogDebug("No text extracted from the image");
                return Results.Problem("No text extracted from the image",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            logger.LogDebug("Extracted JSON: {Json}", output);

            Receipt? receipt = null;
            try
            {
                _ = Json.TryDeserialize(output, out receipt);

                if (receipt == null)
                {
                    logger.LogDebug("Failed to deserialize Ollama output into Receipt. Attempting diagnostic parse.");

                    using var doc = JsonDocument.Parse(output);
                    logger.LogDebug(
                        "JSON is syntactically valid but cannot be mapped to Receipt. RootKind={RootKind}, Properties={Properties}",
                        doc.RootElement.ValueKind,
                        string.Join(", ", doc.RootElement.EnumerateObject().Select(p => p.Name)));

                    receipt = JsonDocumentToReceipt(doc);
                }

                NormalizeReceiptFields(receipt);
                receipt.ImageUrl = filePath;
                context.Receipts.Add(receipt);
                await context.SaveChangesAsync(cancellationToken);
                return Results.Json(receipt);
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Failed to parse JSON output from Ollama");
                return Results.Problem("Failed to parse receipt data",
                    statusCode: StatusCodes.Status500InternalServerError);
            }
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

    private static Receipt JsonDocumentToReceipt(JsonDocument doc)
    {
        var receipt = new Receipt();
        var root = doc.RootElement;
        receipt.ExtractedText = root.GetProperty("ExtractedText").GetString() ?? string.Empty;
        receipt.Title = root.GetProperty("Title").GetString() ?? string.Empty;
        receipt.Description = root.GetProperty("Description").GetString() ?? string.Empty;
        receipt.Vendor = root.GetProperty("Vendor").GetString() ?? string.Empty;
        receipt.State = root.GetProperty("State").GetString() ?? string.Empty;
        receipt.City = root.GetProperty("City").GetString() ?? string.Empty;
        receipt.Country = root.GetProperty("Country").GetString() ?? string.Empty;
        receipt.Tax = root.GetProperty("Tax").GetDecimal();
        receipt.Total = root.GetProperty("Total").GetDecimal();
        receipt.PurchaseDate = Dates.TryDate(root.GetProperty("PurchaseDate").GetString() ?? string.Empty);
        receipt.CategoryId = root.GetProperty("CategoryId").GetInt32();
        return receipt;
    }

    private static void NormalizeReceiptFields(Receipt receipt)
    {
        receipt.ExtractedText = receipt.ExtractedText.Truncate(4096);
        receipt.Title = receipt.Title.Truncate(100);
        receipt.Description = receipt.Description.Truncate(4096);
        receipt.Vendor = receipt.Vendor.Truncate(100);
        receipt.State = receipt.State.Truncate(100);
        receipt.City = receipt.City.Truncate(100);
        receipt.Country = receipt.Country.Truncate(100);
        receipt.CategoryId = receipt.CategoryId == 0 ? 13 : receipt.CategoryId;
        receipt.CreatedAt = DateTime.UtcNow;
        receipt.UpdatedAt = DateTime.UtcNow;
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
