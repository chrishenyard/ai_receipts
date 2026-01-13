using ai_receipts.Settings;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OllamaSharp.Models.Chat;
using System.Text;

namespace ai_receipts;

public partial class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.WebHost.UseKestrel(builder =>
        {
            builder.AddServerHeader = false;
        });

        builder.Host
            .UseDefaultServiceProvider((context, options) =>
            {
                options.ValidateOnBuild = true;
            });

        builder
            .AddServiceDefaults()
            .AddConfiguration();

        builder.Services
            .AddOpenApi()
            .AddProblemDetails()
            .AddSettings()
            .AddHttp()
            .AddServices();

        var app = builder.Build();

        app.MapDefaultEndpoints();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/openapi/v1.json", "v1");
            });
        }

        app.UseHttpsRedirection();

        app.MapPost("/receipt", async (HttpRequest request, OllamaApiClient ollamaClient) =>
        {
            if (string.IsNullOrEmpty(request.ContentType) || !request.ContentType.StartsWith("image/"))
            {
                return Results.BadRequest("Please upload an image (image/jpeg, image/png)");
            }

            try
            {
                using var memoryStream = new MemoryStream();
                await request.Body.CopyToAsync(memoryStream);
                var imageBytes = memoryStream.ToArray();
                var base64Image = Convert.ToBase64String(imageBytes);

                var chatRequest = new ChatRequest
                {
                    Model = "granite-3-2b-instruct",
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
                    Stream = false
                };

                var chatResponse = ollamaClient.ChatAsync(chatRequest);

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
        })
        .WithName("Receipt");

        app.Run();
    }
}

public static class ServiceExtensions
{
    public static IServiceCollection AddSettings(this IServiceCollection services)
    {
        services
           .AddOptions<OllamaSettings>()
           .BindConfiguration(OllamaSettings.SectionName)
           .ValidateDataAnnotations()
           .ValidateOnStart();

        return services;
    }

    public static IServiceCollection AddHttp(this IServiceCollection services)
    {
        services
            .AddHttpClient("ollama", (serviceProvider, httpClient) =>
            {
                var ollamaSettings = serviceProvider.GetRequiredService<IOptions<OllamaSettings>>().Value;
                httpClient.BaseAddress = new Uri(ollamaSettings.Url);
            });

        return services;
    }

    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddSingleton<OllamaApiClient>(sp =>
        {
            var httpClient = sp.GetRequiredService<IHttpClientFactory>().CreateClient("ollama");
            return new OllamaApiClient(httpClient);
        });

        return services;
    }

    public static WebApplicationBuilder AddConfiguration(this WebApplicationBuilder builder)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(builder.Environment.ContentRootPath)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        builder.Configuration.AddConfiguration(configuration);

        return builder;
    }
}