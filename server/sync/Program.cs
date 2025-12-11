using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAllOrigins",
            builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
    });

var app = builder.Build();

app.UseCors("AllowAllOrigins");

// ----------------------------------------------------------

Data? links = null;
ThemeSettings? themeSettings = null;

const string CONFIG_DIR_PATH = "config";
if (!Directory.Exists(CONFIG_DIR_PATH))
{
    Directory.CreateDirectory(CONFIG_DIR_PATH);
}

const string linksDataFilePath = $"{CONFIG_DIR_PATH}/linksData.json";
const string themeSettingsFilePath = $"{CONFIG_DIR_PATH}/themeSettings.json";

void SaveLinksData()
{
    var options = new JsonSerializerOptions { WriteIndented = true };

    string jsonString = JsonSerializer.Serialize(links, options);
    File.WriteAllText(linksDataFilePath, jsonString);
}

void LoadLinksData()
{
    if (!File.Exists(linksDataFilePath))
    {
        return;
    }

    string jsonString = File.ReadAllText(linksDataFilePath);
    links = JsonSerializer.Deserialize<Data>(jsonString);
}

void SaveThemeSettings()
{
    var options = new JsonSerializerOptions { WriteIndented = true };

    string jsonString = JsonSerializer.Serialize(themeSettings, options);
    File.WriteAllText(themeSettingsFilePath, jsonString);
}

void LoadThemeSettings()
{
    if (!File.Exists(themeSettingsFilePath))
    {
        return;
    }

    string jsonString = File.ReadAllText(themeSettingsFilePath);
    themeSettings = JsonSerializer.Deserialize<ThemeSettings>(jsonString);
}

LoadLinksData();
LoadThemeSettings();

app.MapGet("/links", () =>
{
    Console.WriteLine("Sent links data");
    return links;
});

app.MapPost("/links", ([FromBody] Data data) => {
    Console.WriteLine("Received links data");
    links = data;
    SaveLinksData();
    return Results.Ok(links);
});

app.MapGet("/theme", () =>
{
    Console.WriteLine("Sent theme settings");
    return themeSettings;
});

app.MapPost("/theme", ([FromBody] ThemeSettings settings) =>
{
    Console.WriteLine("Received theme settings");
    themeSettings = settings;
    SaveThemeSettings();
    return Results.Ok(themeSettings);
});

app.Run();

public class Link {
    public string? Url { get; set; }
    public string? Title { get; set; }
}

public class Group {
    public string? Id { get; set; }
    public string? Name { get; set; }
    public List<Link>? Links { get; set; }
    public List<Group>? Groups { get; set; }
}

public class Data {
    public List<Group>? Groups { get; set; }
}

public class ThemeSettings {
    public bool RandomArt { get; set; }
    public string? ArtName { get; set; }
    public bool AccentColorFromArt { get; set; }
    public string? ClockFont { get; set; }
}
