namespace AI.Receipts.Serializers;

public static class Json
{
    public static bool TryDeserialize<T>(string json, out T? obj)
    {
        try
        {
            obj = Newtonsoft.Json.JsonConvert.DeserializeObject<T>(json);
            return obj != null;
        }
        catch
        {
            obj = default;
            return false;
        }
    }
}
