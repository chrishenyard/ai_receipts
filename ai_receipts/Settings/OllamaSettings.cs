using System.ComponentModel.DataAnnotations;

namespace ai_receipts.Settings;

public class OllamaSettings
{
    public const string SectionName = "OllamaSettings";

    [Url]
    public string Url { get; set; } = "http://localhost:11434";
    [Required]
    public string VisionModel { get; set; } = null!;
    public int TimeoutFromMinutes { get; set; } = 5;
}
