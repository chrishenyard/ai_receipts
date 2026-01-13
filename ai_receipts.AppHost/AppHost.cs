var builder = DistributedApplication.CreateBuilder(args);

var ollama = builder.AddOllama("ollama")
    .WithDataVolume("ollama")
    .WithAnnotation(new ContainerImageAnnotation
    {
        Registry = "docker.io",
        Image = "ollama/ollama",
        Tag = "0.14.0-rc2"
    })
    .WithOpenWebUI();

var visionModel = ollama.AddModel("granite3.2-vision");

builder.AddProject<Projects.ai_receipts>("ai-receipts")
    .WithReference(visionModel)
    .WaitFor(visionModel);

builder.Build().Run();
