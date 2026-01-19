using AI.Receipts.Configuration;
using AI.Receipts.Data;
using AI.Receipts.Services;
using AI.Receipts.Settings;
using Microsoft.EntityFrameworkCore;
using OllamaSharp;
using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace AI.Receipts.Configuration;

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

    public static IServiceCollection AddDbContext(
        this IServiceCollection services,
        IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DatabaseContext");
        services
            .AddDbContext<AiReceiptsDbContext>(options =>
            {
                options.UseSqlite(connectionString);
            });

        return services;
    }

    public static IServiceCollection AddHttp(
        this IServiceCollection services,
        IConfiguration config)
    {
        var ollamaSettings = config
            .GetSection(OllamaSettings.SectionName)
            .Get<OllamaSettings>()!;

        services
            .AddHttpClient("ollama", (httpClient) =>
            {
                httpClient.BaseAddress = new Uri(ollamaSettings.Url);
                httpClient.Timeout = TimeSpan.FromMinutes(ollamaSettings.TimeoutFromMinutes);
            })
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            });

        return services;
    }

    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped(sp =>
        {
            var httpClient = sp.GetRequiredService<IHttpClientFactory>().CreateClient("ollama");
            return new OllamaApiClient(httpClient);
        });

        services.AddHostedService<OllamaModelInitializer>();

        return services;
    }

    public static IServiceCollection AddTelemetry(
    this IServiceCollection services,
    IConfiguration config)
    {
        var seqSettings = config.GetSection("SeqSettings")
            .Get<SeqSettings>()!;

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService("AI.Receipts"))
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(seqSettings.ServerUrl);
                    options.Protocol = OtlpExportProtocol.HttpProtobuf;
                    options.Headers = $"X-Seq-ApiKey={seqSettings.ApiKey}";
                }))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(seqSettings.ServerUrl);
                    options.Protocol = OtlpExportProtocol.HttpProtobuf;
                    options.Headers = $"X-Seq-ApiKey={seqSettings.ApiKey}";
                }))
            .WithLogging(logging => logging
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(seqSettings.ServerUrl);
                    options.Protocol = OtlpExportProtocol.HttpProtobuf;
                    options.Headers = $"X-Seq-ApiKey={seqSettings.ApiKey}";
                }));

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
