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
ArtSettings? artSettings = null;

const string CONFIG_DIR_PATH = "config";
if (!Directory.Exists(CONFIG_DIR_PATH))
{
    Directory.CreateDirectory(CONFIG_DIR_PATH);
}

const string linksDataFilePath = $"{CONFIG_DIR_PATH}/linksData.json";
const string artSettingsFilePath = $"{CONFIG_DIR_PATH}/artSettings.json";

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

void SaveArtSettings()
{
    var options = new JsonSerializerOptions { WriteIndented = true };

    string jsonString = JsonSerializer.Serialize(artSettings, options);
    File.WriteAllText(artSettingsFilePath, jsonString);
}

void LoadArtSettings()
{
    if (!File.Exists(artSettingsFilePath))
    {
        return;
    }

    string jsonString = File.ReadAllText(artSettingsFilePath);
    artSettings = JsonSerializer.Deserialize<ArtSettings>(jsonString);
}

LoadLinksData();
LoadArtSettings();

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

app.MapGet("/art", () =>
{
    Console.WriteLine("Sent art settings");
    return artSettings;
});

app.MapPost("/art", ([FromBody] ArtSettings settings) =>
{
    Console.WriteLine("Received art settings");
    artSettings = settings;
    SaveArtSettings();
    return Results.Ok(artSettings);
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

public class ArtSettings {
    public bool Random { get; set; }
    public string? ArtName { get; set; }
    public bool ClockColorFromArt { get; set; }
}
