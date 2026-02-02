namespace AI.Receipts.IO;

public static class File
{
    public static readonly string[] SupportedImageTypes =
    [
        "image/jpeg",
        "image/png",
        "image/bmp",
        "image/gif",
        "image/tiff",
        "image/webp"
    ];

    public static readonly List<byte[]> ImageSignatures =
    [
        // JPEG
        [0xFF, 0xD8, 0xFF, 0xE0],
        [0xFF, 0xD8, 0xFF, 0xE1],
        // PNG
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        // GIF
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
        // BMP
        [0x42, 0x4D],
        // TIFF
        [0x49, 0x49, 0x2A, 0x00],
        [0x4D, 0x4D, 0x00, 0x2A],
        // WEBP
        [0x52, 0x49, 0x46, 0x46],
        // PDF
        [0x25, 0x50, 0x44, 0x46]
    ];

    public static bool IsValidImage(IFormFile file)
    {
        try
        {
            using var stream = file.OpenReadStream();
            int maxSignatureLength = ImageSignatures.Max(s => s.Length);
            byte[] buffer = new byte[maxSignatureLength];

            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }

            int bytesRead = stream.Read(buffer, 0, buffer.Length);

            foreach (var signature in ImageSignatures)
            {
                if (bytesRead >= signature.Length)
                {
                    if (signature.SequenceEqual(buffer.Take(signature.Length)))
                    {
                        if (stream.CanSeek)
                        {
                            stream.Seek(0, SeekOrigin.Begin);
                        }

                        return true;
                    }
                }
            }

            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }

            return false;
        }
        catch { return false; }
    }
}
