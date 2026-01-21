using AI.Receipts;
using AI.Receipts.Configuration;
using AI.Receipts.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseKestrel(builder =>
{
    builder.AddServerHeader = false;
});

builder.Host
    .UseDefaultServiceProvider((context, options) =>
    {
        options.ValidateOnBuild = true;
    })
    .UseSerilog((context, configuration) =>
    {
        configuration
            .ReadFrom.Configuration(context.Configuration);
    });

builder
    .AddConfiguration();

var configuration = builder.Configuration;

builder.Services
    .AddAntiforgery(options =>
    {
        options.HeaderName = "X-XSRF-TOKEN";
    })
    .AddOpenApi()
    .AddTelemetry(configuration)
    .AddExceptionHandler<GlobalExceptionHandler>()
    .AddProblemDetails()
    .AddSettings()
    .AddHttp(configuration)
    .AddServices()
    .AddDbContext(configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1");
    });
}

app.UseHttpsRedirection()
    .UseExceptionHandler()
    .UseAntiforgery();

EndPoints.Map(app);
app.Run();
