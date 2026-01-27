using System.ComponentModel.DataAnnotations;

namespace AI.Receipts.Settings;

public class OllamaSettings
{
    public const string SectionName = "OllamaSettings";

    [Url]
    public string Url { get; set; } = "http://localhost:11434";
    [Required]
    public string VisionModel { get; set; } = null!;
    public int TimeoutFromMinutes { get; set; } = 5;
    public int ContextWindowSize { get; set; } = 2048;
}
