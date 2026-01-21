using OllamaSharp;

namespace AI.Receipts.Services;

public interface IOllamaClientFactory
{
    OllamaApiClient CreateClient();
}

public class OllamaClientFactory : IOllamaClientFactory
{
    private readonly IHttpClientFactory _httpClientFactory;

    public OllamaClientFactory(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public OllamaApiClient CreateClient()
    {
        var httpClient = _httpClientFactory.CreateClient("ollama");
        return new OllamaApiClient(httpClient);
    }
}